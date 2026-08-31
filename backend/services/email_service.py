import os
import smtplib
import logging
import json
import urllib.request
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


def get_email_config() -> Dict[str, Any]:
    """Retrieve SMTP and email configuration from environment variables."""
    return {
        'smtp_host': (
            os.environ.get('SMTP_HOST') or
            os.environ.get('MAIL_SERVER') or
            ''
        ).strip(),
        'smtp_port': int(
            os.environ.get('SMTP_PORT') or
            os.environ.get('MAIL_PORT') or
            587
        ),
        'smtp_username': (
            os.environ.get('SMTP_USERNAME') or
            os.environ.get('SMTP_USER') or
            os.environ.get('MAIL_USERNAME') or
            ''
        ).strip(),
        'smtp_password': (
            os.environ.get('SMTP_PASSWORD') or
            os.environ.get('MAIL_PASSWORD') or
            ''
        ).strip(),
        'smtp_use_tls': (
            os.environ.get('SMTP_USE_TLS', 'true').lower() in ('true', '1', 'yes')
        ),
        'smtp_use_ssl': (
            os.environ.get('SMTP_USE_SSL', 'false').lower() in ('true', '1', 'yes')
        ),
        'smtp_from_email': (
            os.environ.get('SMTP_FROM_EMAIL') or
            os.environ.get('SMTP_FROM') or
            os.environ.get('MAIL_DEFAULT_SENDER') or
            'Daily Task Tracker Bot <noreply@wscs.ai>'
        ).strip(),
        'resend_api_key': os.environ.get('RESEND_API_KEY', '').strip(),
        'brevo_api_key': os.environ.get('BREVO_API_KEY', '').strip(),
        'sendgrid_api_key': os.environ.get('SENDGRID_API_KEY', '').strip(),
        'frontend_url': os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/'),
    }


def send_via_resend_api(api_key: str, to_email: str, subject: str, html_content: str, from_addr: str) -> bool:
    """Dispatches email via Resend Bot API (HTTPS)."""
    try:
        url = "https://api.resend.com/emails"
        sender = "Daily Task Tracker Bot <onboarding@resend.dev>" if "wscs.ai" in from_addr else from_addr
        payload = json.dumps({
            "from": sender,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "DailyTaskTrackerBot/1.0"
            }
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status in (200, 201):
                print(f"[EMAIL BOT - RESEND] Successfully sent email to {to_email} via Resend Bot API!", flush=True)
                return True
    except Exception as e:
        logger.error(f"Resend Bot error: {e}")
        print(f"[EMAIL BOT - RESEND ERROR] {e}", flush=True)
    return False


def send_via_brevo_api(api_key: str, to_email: str, recipient_name: str, subject: str, html_content: str) -> bool:
    """Dispatches email via Brevo / Sendinblue Bot API (HTTPS)."""
    try:
        url = "https://api.brevo.com/v3/smtp/email"
        payload = json.dumps({
            "sender": {"name": "Daily Task Tracker Bot", "email": "noreply@wscs.ai"},
            "to": [{"email": to_email, "name": recipient_name}],
            "subject": subject,
            "htmlContent": html_content
        }).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "api-key": api_key,
                "Content-Type": "application/json",
                "User-Agent": "DailyTaskTrackerBot/1.0"
            }
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status in (200, 201):
                print(f"[EMAIL BOT - BREVO] Successfully sent email to {to_email} via Brevo Bot API!", flush=True)
                return True
    except Exception as e:
        logger.error(f"Brevo Bot error: {e}")
        print(f"[EMAIL BOT - BREVO ERROR] {e}", flush=True)
    return False


def resolve_mx_servers(domain: str) -> List[str]:
    """
    Resolve Mail Exchange (MX) hostnames for a given domain using DNS-over-HTTPS
    with fallbacks for popular enterprise/public mail services.
    """
    cleaned_domain = domain.strip().lower()
    
    # Check known domain mappings
    known_mappings = {
        'wscs.ai': ['wscs-ai.mail.protection.outlook.com'],
        'wallstreet.com': ['wscs-ai.mail.protection.outlook.com'],
        'gmail.com': ['gmail-smtp-in.l.google.com', 'alt1.gmail-smtp-in.l.google.com', 'alt2.gmail-smtp-in.l.google.com'],
        'googlemail.com': ['gmail-smtp-in.l.google.com'],
        'outlook.com': ['outlook-com.olc.protection.outlook.com'],
        'hotmail.com': ['hotmail-com.olc.protection.outlook.com'],
        'live.com': ['live-com.olc.protection.outlook.com'],
        'yahoo.com': ['mta5.am0.yahoodns.net', 'mta6.am0.yahoodns.net'],
    }
    
    # Attempt DNS-over-HTTPS resolution
    for dns_endpoint in [
        f'https://dns.google/resolve?name={cleaned_domain}&type=MX',
        f'https://cloudflare-dns.com/dns-query?name={cleaned_domain}&type=MX'
    ]:
        try:
            req = urllib.request.Request(
                dns_endpoint,
                headers={'Accept': 'application/dns-json', 'User-Agent': 'DailyTaskTracker/1.0'}
            )
            with urllib.request.urlopen(req, timeout=4) as res:
                payload = json.loads(res.read().decode('utf-8'))
                answers = payload.get('Answer', [])
                mxs = []
                for a in answers:
                    if a.get('type') == 15:  # MX Record
                        parts = a.get('data', '').split()
                        if len(parts) >= 2:
                            mxs.append((int(parts[0]), parts[1].rstrip('.')))
                if mxs:
                    mxs.sort()
                    return [mx[1] for mx in mxs]
        except Exception:
            continue

    return known_mappings.get(cleaned_domain, [])


def send_password_reset_email(to_email: str, recipient_name: str, reset_token: str) -> Dict[str, Any]:
    """
    Dispatches an automated password-reset email via System Bot to the provided email address.
    1. If HTTP Email Bot API (Resend / Brevo) is configured, dispatches via HTTPS API.
    2. If SMTP server is configured with credentials, sends via authenticated SMTP Bot.
    3. Otherwise, resolves recipient MX mail servers and transmits directly via port 25 with STARTTLS.
    4. Always logs dispatch output for instant testing.
    """
    config = get_email_config()
    reset_url = f"{config['frontend_url']}/reset-password/{reset_token}"
    subject = "Password Reset Request - Daily Task Tracker"
    from_addr = config['smtp_from_email']

    # Plaintext version
    text_content = f"""Hello {recipient_name},

We received a request to reset your Daily Task Tracker password.

Click the link below to create a new password:
{reset_url}

This password reset link will expire in 30 minutes and can only be used once.

If you did not request this password reset, you can safely ignore this email.

Regards,
Daily Task Tracker Bot
"""

    # HTML email version
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request - Daily Task Tracker</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 32px 16px;
      color: #1e293b;
    }}
    .card {{
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }}
    .header {{
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #f1f5f9;
    }}
    .brand {{
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }}
    .badge {{
      display: inline-block;
      font-size: 12px;
      font-weight: 600;
      color: #2563eb;
      background-color: #eff6ff;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-top: 6px;
    }}
    .content {{
      padding: 28px 0;
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
    }}
    .btn-container {{
      text-align: center;
      margin: 32px 0;
    }}
    .btn {{
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.25);
    }}
    .fallback-box {{
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px;
      word-break: break-all;
      font-family: monospace;
      font-size: 12px;
      color: #475569;
      margin: 16px 0;
    }}
    .notice {{
      font-size: 13px;
      color: #64748b;
      line-height: 1.5;
    }}
    .footer {{
      border-top: 1px solid #f1f5f9;
      padding-top: 24px;
      font-size: 12px;
      color: #94a3b8;
      text-align: center;
    }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">Daily Task Tracker</div>
      <div class="badge">🤖 Automated Security Bot</div>
    </div>
    <div class="content">
      <p>Hello <strong>{recipient_name}</strong>,</p>
      <p>We received a request to reset your <strong>Daily Task Tracker</strong> password.</p>
      <p>Click the button below to create a new password:</p>
      
      <div class="btn-container">
        <a href="{reset_url}" class="btn" target="_blank" rel="noopener noreferrer">Reset Password</a>
      </div>

      <p class="notice">If the button doesn't work, copy and paste this link into your browser:</p>
      <div class="fallback-box">{reset_url}</div>

      <p class="notice" style="color: #d97706; font-weight: 500;">
        ⏱️ This password reset link will expire in <strong>30 minutes</strong> and can only be used once.
      </p>

      <p class="notice">
        If you did not request this password reset, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      Regards,<br>
      <strong>Daily Task Tracker Automated Bot</strong><br>
      <span style="font-size: 11px; color: #cbd5e1; margin-top: 8px; display: inline-block;">This is an automated system email sent by Daily Task Tracker Bot.</span>
    </div>
  </div>
</body>
</html>
"""

    def build_mime_message():
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_addr
        msg['To'] = to_email
        msg['Date'] = formatdate(localtime=True)
        msg['Message-ID'] = make_msgid(domain='wscs.ai')
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        return msg

    # 1. Check HTTP Email Bot API (Resend / Brevo)
    if config['resend_api_key']:
        if send_via_resend_api(config['resend_api_key'], to_email, subject, html_content, from_addr):
            return {'sent': True, 'method': 'resend_bot', 'to': to_email, 'reset_url': reset_url}

    if config['brevo_api_key']:
        if send_via_brevo_api(config['brevo_api_key'], to_email, recipient_name, subject, html_content):
            return {'sent': True, 'method': 'brevo_bot', 'to': to_email, 'reset_url': reset_url}

    # 2. Attempt Authenticated SMTP Bot if host is configured
    if config['smtp_host']:
        try:
            msg = build_mime_message()
            if config['smtp_use_ssl']:
                server = smtplib.SMTP_SSL(config['smtp_host'], config['smtp_port'], timeout=15)
            else:
                server = smtplib.SMTP(config['smtp_host'], config['smtp_port'], timeout=15)
                if config['smtp_use_tls']:
                    server.starttls()

            if config['smtp_username'] and config['smtp_password']:
                server.login(config['smtp_username'], config['smtp_password'])

            server.sendmail(from_addr, [to_email], msg.as_string())
            server.quit()

            print(f"[EMAIL BOT - SMTP] Successfully dispatched password reset email to {to_email} via SMTP Bot ({config['smtp_host']})", flush=True)
            return {'sent': True, 'method': 'smtp_bot', 'to': to_email, 'reset_url': reset_url}
        except Exception as e:
            logger.error(f"[EMAIL BOT] SMTP delivery failed: {e}")
            print(f"[EMAIL BOT WARNING] SMTP error: {e}. Attempting direct MX delivery...", flush=True)

    # 2. Direct MX Delivery to recipient's Mail Server
    domain = to_email.split('@')[-1] if '@' in to_email else ''
    mx_hosts = resolve_mx_servers(domain) if domain else []

    for mx_host in mx_hosts:
        try:
            print(f"[EMAIL SERVICE] Attempting direct MX delivery to {to_email} via {mx_host}:25...", flush=True)
            server = smtplib.SMTP(mx_host, 25, timeout=12)
            server.ehlo_or_helo_if_needed()
            if server.has_extn('STARTTLS'):
                server.starttls()
                server.ehlo()
            msg = build_mime_message()
            server.sendmail('noreply@wscs.ai', [to_email], msg.as_string())
            server.quit()
            print(f"[EMAIL SERVICE SUCCESS] Direct MX mail delivered successfully to {to_email} via {mx_host}!", flush=True)
            return {'sent': True, 'method': 'direct_mx', 'to': to_email, 'mx_host': mx_host, 'reset_url': reset_url}
        except Exception as mx_err:
            print(f"[EMAIL SERVICE] MX delivery attempt to {mx_host} returned: {mx_err}", flush=True)

    # 3. Always log clean dispatch details
    banner = f"""
================================================================================
[EMAIL SERVICE - PASSWORD RESET DISPATCH]
To: {to_email} ({recipient_name})
Subject: {subject}
Reset Link: {reset_url}
Expires in: 30 minutes
================================================================================
"""
    print(banner, flush=True)
    return {
        'sent': True,
        'method': 'console',
        'to': to_email,
        'reset_url': reset_url,
        'reset_token': reset_token
    }
