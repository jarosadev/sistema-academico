import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import { DataTable } from '../../components/ui/Table';
import Modal from '../../components/ui/ModalImproved';
import Loading from '../../components/ui/Loading';
import TipoEvaluacionForm from './TipoEvaluacionForm';

const TiposEvaluacionList = ({ materiaId }) => {
    const [tiposEvaluacion, setTiposEvaluacion] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTipo, setSelectedTipo] = useState(null);
    const [totalPorcentaje, setTotalPorcentaje] = useState(0);

    const calcularTotalPorcentaje = (tipos) => {
        return tipos
            .filter(tipo => tipo.activo === 1)
            .reduce((sum, tipo) => sum + Number(tipo.porcentaje), 0);
    };

    const fetchTiposEvaluacion = async () => {
        if (!materiaId) return;

        try {
            setLoading(true);
            const response = await dataService.tiposEvaluacion.obtenerTodos(materiaId);
            setTiposEvaluacion(response.data);
            setTotalPorcentaje(calcularTotalPorcentaje(response.data));
        } catch (error) {
            notificationService.error('Error al cargar los tipos de evaluación');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTiposEvaluacion();
    }, [materiaId]);

    const handleDelete = async (id) => {
        const confirmed = await notificationService.confirm({
            title: 'Eliminar tipo de evaluación',
            message: '¿Está seguro de eliminar este tipo de evaluación?',
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar'
        });

        if (confirmed) {
            try {
                await dataService.tiposEvaluacion.eliminar(materiaId, id);
                notificationService.success('Tipo de evaluación eliminado exitosamente');
                fetchTiposEvaluacion();
            } catch (error) {
                notificationService.error(error.response?.data?.message || 'Error al eliminar el tipo de evaluación');
            }
        }
    };

    const handleModalClose = () => {
        setModalVisible(false);
        setSelectedTipo(null);
    };

    const handleSuccess = () => {
        handleModalClose();
        fetchTiposEvaluacion();
    };

    const renderPorcentaje = (row) => `${Number(row.porcentaje).toFixed(2)}%`;

    const renderEstado = (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.activo === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
            {row.activo === 1 ? 'Activo' : 'Inactivo'}
        </span>
    );

    const renderAcciones = (row) => (
        <div className="flex space-x-2">
            <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                    setSelectedTipo(row);
                    setModalVisible(true);
                }}
            >
                <Pencil className="w-4 h-4 mr-1" />
                Editar
            </Button>
            <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(row.id_tipo_evaluacion)}
            >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
            </Button>
        </div>
    );

    const columns = [
        {
            key: 'nombre',
            title: 'Nombre',
            dataIndex: 'nombre'
        },
        {
            key: 'porcentaje',
            title: 'Porcentaje',
            dataIndex: 'porcentaje',
            render: renderPorcentaje
        },
        {
            key: 'orden',
            title: 'Orden',
            dataIndex: 'orden'
        },
        {
            key: 'activo',
            title: 'Estado',
            dataIndex: 'activo',
            render: renderEstado
        },
        {
            key: 'acciones',
            title: 'Acciones',
            render: renderAcciones
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <Button
                    onClick={() => setModalVisible(true)}
                    disabled={totalPorcentaje >= 100}
                    className="w-full lg:w-auto"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Tipo de Evaluación
                </Button>
                <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-2 lg:space-y-0">
                    <span className="font-medium text-center lg:text-left">
                        Total Porcentaje: {totalPorcentaje.toFixed(2)}%
                    </span>
                    {totalPorcentaje > 100 && (
                        <span className="text-red-600 text-center lg:text-left">
                            ¡El total excede el 100%!
                        </span>
                    )}
                </div>
            </div>

            <DataTable
                columns={columns}
                data={tiposEvaluacion}
                loading={loading}
                emptyMessage="No hay tipos de evaluación registrados"
                sortable={true}
                className="w-full"
            />

            <Modal
                isOpen={modalVisible}
                onClose={handleModalClose}
                title={selectedTipo ? 'Editar Tipo de Evaluación' : 'Nuevo Tipo de Evaluación'}
                size="xl"
            >
                <TipoEvaluacionForm
                    materiaId={materiaId}
                    tipoEvaluacion={selectedTipo}
                    onSuccess={handleSuccess}
                    onCancel={handleModalClose}
                    totalPorcentaje={totalPorcentaje}
                />
            </Modal>
        </div>
    );
};

export default TiposEvaluacionList;
