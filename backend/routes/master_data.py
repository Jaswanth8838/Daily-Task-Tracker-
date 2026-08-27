from flask import Blueprint, request, jsonify
from app import db
from models import Trainer, Technology, TrainingConcept
from middleware import role_required, auth_required

master_data_bp = Blueprint('master_data', __name__)

# ─── Trainers ───────────────────────────────────────────────────────────────────

@master_data_bp.route('/api/trainers', methods=['GET'])
@role_required('hr', 'intern')
def get_trainers():
    """Interns need this to populate DailyTrackerForm dropdowns."""
    trainers = Trainer.query.filter_by(status='active').all()
    return jsonify([t.to_dict() for t in trainers]), 200


@master_data_bp.route('/api/trainers', methods=['POST'])
@role_required('hr')
def create_trainer():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Name is required'}), 400

    trainer = Trainer(
        name=name,
        email=data.get('email'),
        specialization=data.get('specialization'),
        status=data.get('status', 'active')
    )
    db.session.add(trainer)
    db.session.commit()
    return jsonify(trainer.to_dict()), 201


@master_data_bp.route('/api/trainers/<int:trainer_id>', methods=['PUT'])
@role_required('hr')
def update_trainer(trainer_id):
    trainer = Trainer.query.get_or_404(trainer_id)
    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        trainer.name = data['name'].strip()
    if 'email' in data:
        trainer.email = data['email']
    if 'specialization' in data:
        trainer.specialization = data['specialization']
    if 'status' in data:
        trainer.status = data['status']

    db.session.commit()
    return jsonify(trainer.to_dict()), 200


@master_data_bp.route('/api/trainers/<int:trainer_id>', methods=['DELETE'])
@role_required('hr')
def delete_trainer(trainer_id):
    trainer = Trainer.query.get_or_404(trainer_id)
    db.session.delete(trainer)
    db.session.commit()
    return jsonify({'message': 'Trainer deleted'}), 200


# ─── Technologies ──────────────────────────────────────────────────────────────

@master_data_bp.route('/api/technologies', methods=['GET'])
@role_required('hr', 'intern')
def get_technologies():
    techs = Technology.query.all()
    return jsonify([t.to_dict() for t in techs]), 200


@master_data_bp.route('/api/technologies', methods=['POST'])
@role_required('hr')
def create_technology():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Name is required'}), 400

    if Technology.query.filter_by(name=name).first():
        return jsonify({'error': 'Technology already exists'}), 400

    tech = Technology(name=name, status=data.get('status', 'active'))
    db.session.add(tech)
    db.session.commit()
    return jsonify(tech.to_dict()), 201


@master_data_bp.route('/api/technologies/<int:tech_id>', methods=['PUT'])
@role_required('hr')
def update_technology(tech_id):
    tech = Technology.query.get_or_404(tech_id)
    data = request.get_json() or {}

    if 'name' in data and data['name'].strip():
        tech.name = data['name'].strip()
    if 'status' in data:
        tech.status = data['status']

    db.session.commit()
    return jsonify(tech.to_dict()), 200


@master_data_bp.route('/api/technologies/<int:tech_id>', methods=['DELETE'])
@role_required('hr')
def delete_technology(tech_id):
    tech = Technology.query.get_or_404(tech_id)
    db.session.delete(tech)
    db.session.commit()
    return jsonify({'message': 'Technology deleted'}), 200


# ─── Concepts ─────────────────────────────────────────────────────────────────

@master_data_bp.route('/api/concepts', methods=['GET'])
@role_required('hr', 'intern')
def get_concepts():
    technology_id = request.args.get('technology_id')
    query = TrainingConcept.query
    if technology_id:
        query = query.filter_by(technology_id=technology_id)
    concepts = query.all()
    return jsonify([c.to_dict() for c in concepts]), 200


@master_data_bp.route('/api/concepts', methods=['POST'])
@role_required('hr')
def create_concept():
    data = request.get_json() or {}
    concept_name = (data.get('concept') or '').strip()
    technology_id = data.get('technology_id')

    if not concept_name or not technology_id:
        return jsonify({'error': 'Concept and technology_id are required'}), 400

    concept = TrainingConcept(
        concept=concept_name,
        technology_id=technology_id,
        status=data.get('status', 'active')
    )
    db.session.add(concept)
    db.session.commit()
    return jsonify(concept.to_dict()), 201


@master_data_bp.route('/api/concepts/<int:concept_id>', methods=['PUT'])
@role_required('hr')
def update_concept(concept_id):
    concept = TrainingConcept.query.get_or_404(concept_id)
    data = request.get_json() or {}

    if 'concept' in data and data['concept'].strip():
        concept.concept = data['concept'].strip()
    if 'status' in data:
        concept.status = data['status']

    db.session.commit()
    return jsonify(concept.to_dict()), 200


@master_data_bp.route('/api/concepts/<int:concept_id>', methods=['DELETE'])
@role_required('hr')
def delete_concept(concept_id):
    concept = TrainingConcept.query.get_or_404(concept_id)
    db.session.delete(concept)
    db.session.commit()
    return jsonify({'message': 'Concept deleted'}), 200
