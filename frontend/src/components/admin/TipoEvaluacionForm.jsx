import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Toggle from '../../components/ui/Toggle';

const TipoEvaluacionForm = ({ materiaId, tipoEvaluacion, onSuccess, onCancel, totalPorcentaje }) => {
    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState({
        nombre: '',
        porcentaje: '',
        orden: '1',
        activo: 1
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (tipoEvaluacion) {
            setValues({
                nombre: tipoEvaluacion.nombre || '',
                porcentaje: tipoEvaluacion.porcentaje || '',
                orden: String(tipoEvaluacion.orden || 1),
                activo: typeof tipoEvaluacion.activo === 'number' ? tipoEvaluacion.activo : 1
            });
        }
    }, [tipoEvaluacion]);

    const validateForm = () => {
        const newErrors = {};

        // Validación del nombre
        if (!values.nombre?.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (values.nombre.length > 50) {
            newErrors.nombre = 'El nombre no puede exceder los 50 caracteres';
        }

        // Validación del porcentaje
        if (!values.porcentaje) {
            newErrors.porcentaje = 'El porcentaje es requerido';
        } else {
            const porcentajeNum = Number(values.porcentaje);
            if (isNaN(porcentajeNum)) {
                newErrors.porcentaje = 'El porcentaje debe ser un número válido';
            } else if (porcentajeNum < 0 || porcentajeNum > 100) {
                newErrors.porcentaje = 'El porcentaje debe estar entre 0 y 100';
            } else {
                // Validar que no exceda el 100% en total
                const currentTotal = tipoEvaluacion 
                    ? totalPorcentaje - Number(tipoEvaluacion.porcentaje) + porcentajeNum
                    : totalPorcentaje + porcentajeNum;
                
                if (currentTotal > 100) {
                    newErrors.porcentaje = `El total de porcentajes (${currentTotal.toFixed(2)}%) excedería el 100%`;
                }
            }
        }

        // Validación del orden
        if (!values.orden) {
            newErrors.orden = 'El orden es requerido';
        } else {
            const ordenNum = parseInt(values.orden);
            if (isNaN(ordenNum) || ordenNum < 1) {
                newErrors.orden = 'El orden debe ser un número mayor a 0';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleToggleChange = (checked) => {
        setValues(prev => ({
            ...prev,
            activo: checked ? 1 : 0
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const dataToSend = {
                nombre: values.nombre.trim(),
                porcentaje: Number(values.porcentaje).toFixed(2),
                orden: parseInt(values.orden),
                activo: values.activo
            };

            if (tipoEvaluacion) {
                await dataService.tiposEvaluacion.actualizar(
                    materiaId,
                    tipoEvaluacion.id_tipo_evaluacion,
                    dataToSend
                );
                notificationService.success('Tipo de evaluación actualizado exitosamente');
            } else {
                await dataService.tiposEvaluacion.crear(materiaId, dataToSend);
                notificationService.success('Tipo de evaluación creado exitosamente');
            }
            onSuccess();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error al procesar la solicitud';
            notificationService.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const porcentajeDisponible = 100 - (totalPorcentaje - (tipoEvaluacion ? Number(tipoEvaluacion.porcentaje) : 0));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Input
                    name="nombre"
                    label="Nombre"
                    value={values.nombre}
                    onChange={handleChange}
                    error={errors.nombre}
                    placeholder="Ej: Primer Parcial"
                    maxLength={50}
                />
            </div>

            <div>
                <Input
                    name="porcentaje"
                    label="Porcentaje"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={values.porcentaje}
                    onChange={handleChange}
                    error={errors.porcentaje}
                    placeholder="Ej: 30.00"
                />
                <div className="mt-1 text-sm text-gray-500">
                    Porcentaje disponible: {porcentajeDisponible.toFixed(2)}%
                </div>
            </div>

            <div>
                <Input
                    name="orden"
                    label="Orden"
                    type="number"
                    min={1}
                    value={values.orden}
                    onChange={handleChange}
                    error={errors.orden}
                    placeholder="Ej: 1"
                />
            </div>

            <div>
                <Toggle
                    name="activo"
                    label="Activo"
                    checked={values.activo === 1}
                    onChange={handleToggleChange}
                />
            </div>

            <div className="flex justify-end space-x-2">
                <Button 
                    type="button"
                    onClick={onCancel} 
                    variant="secondary"
                >
                    Cancelar
                </Button>
                <Button 
                    type="submit" 
                    loading={loading}
                >
                    {tipoEvaluacion ? 'Actualizar' : 'Crear'}
                </Button>
            </div>
        </form>
    );
};

export default TipoEvaluacionForm;
