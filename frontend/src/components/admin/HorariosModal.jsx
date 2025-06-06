import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit, Trash2, AlertCircle, Save, X } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Loading from '../ui/Loading';
import Input from '../ui/Input';
import Modal from '../ui/ModalImproved';
import SearchableSelect from '../ui/SearchableSelect';

const HorariosModal = ({ isOpen, onClose, materia }) => {
  const [loading, setLoading] = useState(true);
  const [horarios, setHorarios] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHorario, setEditingHorario] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    id_docente: '',
    gestion: new Date().getFullYear(),
    periodo: 1,
    paralelo: 'A',
    dia_semana: '',
    hora_inicio: '',
    hora_fin: '',
    aula: '',
    modalidad: 'Presencial'
  });

  const diasSemana = [
    { value: 'Lunes', label: 'Lunes' },
    { value: 'Martes', label: 'Martes' },
    { value: 'Miércoles', label: 'Miércoles' },
    { value: 'Jueves', label: 'Jueves' },
    { value: 'Viernes', label: 'Viernes' },
    { value: 'Sábado', label: 'Sábado' }
  ];

  const modalidades = [
    { value: 'Presencial', label: 'Presencial' },
    { value: 'Virtual', label: 'Virtual' },
    { value: 'Híbrido', label: 'Híbrido' }
  ];

  useEffect(() => {
    if (isOpen && materia) {
      cargarDatos();
    }
  }, [isOpen, materia]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [horariosResponse, docentesResponse] = await Promise.all([
        dataService.horarios.obtenerPorMateria(materia.id_materia),
        dataService.docentes.obtenerTodos({ activo: true, limit: 100 })
      ]);
      
      setHorarios(horariosResponse.data);
      setDocentes(docentesResponse.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      notificationService.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formato de hora
    const horaRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!horaRegex.test(formData.hora_inicio) || !horaRegex.test(formData.hora_fin)) {
      notificationService.warning('Por favor ingrese las horas en formato HH:MM');
      return;
    }

    // Validar que hora_fin sea mayor que hora_inicio
    const [horaInicioH, horaInicioM] = formData.hora_inicio.split(':').map(Number);
    const [horaFinH, horaFinM] = formData.hora_fin.split(':').map(Number);
    const minutosInicio = horaInicioH * 60 + horaInicioM;
    const minutosFin = horaFinH * 60 + horaFinM;
    
    if (minutosFin <= minutosInicio) {
      notificationService.warning('La hora de fin debe ser mayor que la hora de inicio');
      return;
    }

    setSubmitting(true);
    try {
      const dataToSend = {
        ...formData,
        id_materia: materia.id_materia,
        id_docente: parseInt(formData.id_docente)
      };

      if (editingHorario) {
        // Para actualización, solo enviar los campos que pueden cambiar
        const updateData = {
          dia_semana: formData.dia_semana,
          hora_inicio: formData.hora_inicio,
          hora_fin: formData.hora_fin,
          aula: formData.aula,
          modalidad: formData.modalidad
        };
        await dataService.horarios.actualizar(editingHorario.id_horario, updateData);
        notificationService.success('Horario actualizado exitosamente');
      } else {
        await dataService.horarios.crear(dataToSend);
        notificationService.success('Horario creado exitosamente');
      }
      
      resetForm();
      cargarDatos();
    } catch (error) {
      notificationService.error('Error al guardar horario: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (horario) => {
    setFormData({
      id_docente: horario.id_docente.toString(),
      gestion: horario.gestion,
      periodo: horario.periodo,
      paralelo: horario.paralelo,
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      aula: horario.aula,
      modalidad: horario.modalidad || 'Presencial'
    });
    setEditingHorario(horario);
    setShowForm(true);
  };

  const handleDelete = async (idHorario) => {
    const confirmed = await notificationService.confirm({
      title: '¿Está seguro de eliminar este horario?',
      text: 'Esta acción no se puede deshacer.'
    });

    if (confirmed) {
      try {
        await dataService.horarios.eliminar(idHorario);
        notificationService.success('Horario eliminado exitosamente');
        cargarDatos();
      } catch (error) {
        notificationService.error('Error al eliminar horario: ' + error.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id_docente: '',
      gestion: new Date().getFullYear(),
      periodo: 1,
      paralelo: 'A',
      dia_semana: '',
      hora_inicio: '',
      hora_fin: '',
      aula: '',
      modalidad: 'Presencial'
    });
    setEditingHorario(null);
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Preparar opciones para SearchableSelect
  const opcionesDocentes = docentes.map(d => ({
    value: d.id_docente.toString(),
    label: `${d.nombre} ${d.apellido}`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Horarios - ${materia?.nombre || ''}`}
      size="xl"
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
          {/* Botón para agregar nuevo horario */}
          {!showForm && (
            <div className="flex justify-end">
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Horario
              </Button>
            </div>
          )}

          {/* Formulario de horario */}
          {showForm && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                {editingHorario ? 'Editar Horario' : 'Nuevo Horario'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!editingHorario && (
                    <>
                      <div className="md:col-span-2">
                        <SearchableSelect
                          label="Docente"
                          name="id_docente"
                          value={formData.id_docente}
                          onChange={handleInputChange}
                          options={opcionesDocentes}
                          placeholder="Buscar docente..."
                          required
                          allowCustom={false}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Gestión
                        </label>
                        <Input
                          type="number"
                          name="gestion"
                          value={formData.gestion}
                          onChange={handleInputChange}
                          min="2020"
                          max="2030"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Periodo
                        </label>
                        <select
                          name="periodo"
                          value={formData.periodo}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        >
                          <option value={1}>Primero</option>
                          <option value={2}>Segundo</option>
                          <option value={3}>Verano</option>
                          <option value={4}>Invierno</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">
                          Paralelo
                        </label>
                        <Input
                          name="paralelo"
                          value={formData.paralelo}
                          onChange={handleInputChange}
                          placeholder="A"
                          maxLength="1"
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Día de la semana
                    </label>
                    <select
                      name="dia_semana"
                      value={formData.dia_semana}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Seleccione un día...</option>
                      {diasSemana.map(dia => (
                        <option key={dia.value} value={dia.value}>
                          {dia.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Modalidad
                    </label>
                    <select
                      name="modalidad"
                      value={formData.modalidad}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      {modalidades.map(mod => (
                        <option key={mod.value} value={mod.value}>
                          {mod.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Hora de inicio
                    </label>
                    <Input
                      name="hora_inicio"
                      value={formData.hora_inicio}
                      onChange={handleInputChange}
                      placeholder="HH:MM"
                      pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                      title="Formato: HH:MM (ej: 08:30)"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Hora de fin
                    </label>
                    <Input
                      name="hora_fin"
                      value={formData.hora_fin}
                      onChange={handleInputChange}
                      placeholder="HH:MM"
                      pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                      title="Formato: HH:MM (ej: 10:30)"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">
                      Aula
                    </label>
                    <Input
                      name="aula"
                      value={formData.aula}
                      onChange={handleInputChange}
                      placeholder="Ej: A-101"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    loading={submitting}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingHorario ? 'Actualizar' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Lista de horarios */}
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-4">
              Horarios Actuales
            </h3>
            {horarios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {horarios.map(horario => (
                  <Card key={horario.id_horario} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <Clock className="w-5 h-5 text-primary-500 mr-3 mt-1" />
                        <div>
                          <p className="font-medium text-secondary-900">
                            {horario.dia_semana}
                          </p>
                          <p className="text-sm text-secondary-600">
                            {horario.hora_inicio} - {horario.hora_fin}
                          </p>
                          <p className="text-sm text-secondary-600">
                            Aula: {horario.aula}
                          </p>
                          <p className="text-sm text-secondary-600">
                            Docente: {horario.docente_nombre}
                          </p>
                          <p className="text-sm text-secondary-600">
                            Paralelo: {horario.paralelo} | {horario.modalidad}
                          </p>
                          <p className="text-sm text-secondary-500">
                            {horario.gestion} - {horario.periodo_nombre}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(horario)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(horario.id_horario)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-secondary-400 mx-auto mb-3" />
                <p className="text-secondary-600">
                  Esta materia no tiene horarios definidos
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default HorariosModal;
