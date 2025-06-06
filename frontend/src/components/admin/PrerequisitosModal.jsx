import React, { useState, useEffect } from 'react';
import { GitBranch, Plus, Trash2, AlertCircle } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Loading from '../ui/Loading';
import Modal from '../ui/ModalImproved';
import SearchableSelect from '../ui/SearchableSelect';

const PrerequisitosModal = ({ isOpen, onClose, materia }) => {
  const [loading, setLoading] = useState(true);
  const [prerequisitos, setPrerequisitos] = useState([]);
  const [materiasDisponibles, setMateriasDisponibles] = useState([]);
  const [selectedMateria, setSelectedMateria] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && materia) {
      cargarDatos();
    }
  }, [isOpen, materia]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [prereqResponse, materiasResponse] = await Promise.all([
        dataService.prerequisitos.obtenerPorMateria(materia.id_materia),
        dataService.materias.obtenerTodas({ activo: true, limit: 100 })
      ]);

      setPrerequisitos(prereqResponse.data || []);
      
      // Filtrar materias disponibles (excluir la materia actual y las que ya son prerequisitos)
      const prerequisitosIds = (prereqResponse.data || []).map(p => p.id_materia_prerequisito);
      const disponibles = materiasResponse.data.filter(m => 
        m.id_materia !== materia.id_materia && 
        !prerequisitosIds.includes(m.id_materia)
      );
      
      setMateriasDisponibles(disponibles);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      notificationService.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarPrerequisito = async () => {
    if (!selectedMateria) {
      notificationService.warning('Por favor seleccione una materia');
      return;
    }

    setSubmitting(true);
    try {
      await dataService.prerequisitos.agregar(materia.id_materia, {
        id_materia_prerequisito: parseInt(selectedMateria)
      });
      
      notificationService.success('Prerrequisito agregado exitosamente');
      setSelectedMateria('');
      cargarDatos();
    } catch (error) {
      notificationService.error('Error al agregar prerrequisito: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminarPrerequisito = async (idPrerequisito) => {
    const confirmed = await notificationService.confirm({
      title: '¿Está seguro de eliminar este prerrequisito?',
      text: 'Esta acción no se puede deshacer.'
    });

    if (confirmed) {
      try {
        await dataService.prerequisitos.eliminar(materia.id_materia, idPrerequisito);
        notificationService.success('Prerrequisito eliminado exitosamente');
        cargarDatos();
      } catch (error) {
        notificationService.error('Error al eliminar prerrequisito: ' + error.message);
      }
    }
  };

  // Preparar opciones para SearchableSelect
  const opcionesMateria = materiasDisponibles.map(m => ({
    value: m.id_materia.toString(),
    label: `${m.sigla} - ${m.nombre}`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Prerrequisitos - ${materia?.nombre || ''}`}
      size="lg"
      footer={
        <Button onClick={onClose} variant="secondary">
          Cerrar
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loading />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Agregar nuevo prerrequisito */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Agregar Prerrequisito
            </h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <SearchableSelect
                  name="prerequisito"
                  value={selectedMateria}
                  onChange={(e) => setSelectedMateria(e.target.value)}
                  options={opcionesMateria}
                  placeholder="Buscar materia..."
                  disabled={submitting}
                  allowCustom={false}
                  noOptionsText="No hay materias disponibles"
                />
              </div>
              <Button
                onClick={handleAgregarPrerequisito}
                disabled={!selectedMateria || submitting}
                loading={submitting}
                className="mt-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </div>
          </Card>

          {/* Lista de prerrequisitos actuales */}
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Prerrequisitos Actuales
            </h3>
            {prerequisitos.length > 0 ? (
              <div className="space-y-3">
                {prerequisitos.map((prereq, index) => (
                  <Card key={prereq.id_materia_prerequisito || index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <GitBranch className="w-5 h-5 text-primary-500 mr-3" />
                        <div>
                          <p className="font-medium text-secondary-900">
                            {prereq.sigla} - {prereq.nombre}
                          </p>
                          <p className="text-sm text-secondary-600">
                            Semestre {prereq.semestre}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleEliminarPrerequisito(prereq.id_materia_prerequisito)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                <p className="text-secondary-600">
                  Esta materia no tiene prerrequisitos definidos
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PrerequisitosModal;
