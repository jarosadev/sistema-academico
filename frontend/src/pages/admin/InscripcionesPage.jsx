import React, { useState, useEffect } from "react";
import {
	Plus,
	Search,
	ClipboardList,
	UserCheck,
	Calendar,
	Edit,
	Trash2,
	Eye,
} from "lucide-react";
import { dataService } from "../../services/dataService";
import { useDebounce } from "../../hooks/useDebounce";
import { notificationService } from "../../services/notificationService";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Card from "../../components/ui/Card";
import Table, { DataTable } from "../../components/ui/Table";
import Modal from "../../components/ui/ModalImproved";
import Loading from "../../components/ui/Loading";
import InscripcionForm from "../../components/admin/InscripcionForm";
import InscripcionDetalle from "../../components/admin/InscripcionDetalle";

const InscripcionesPage = () => {
	const [inscripciones, setInscripciones] = useState([]);
	const [loading, setLoading] = useState(true);

	// Estados para modales
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showDetailModal, setShowDetailModal] = useState(false);
	const [selectedInscripcion, setSelectedInscripcion] = useState(null);

	// Estados para filtros y paginación
	const [filtros, setFiltros] = useState({
		search: "",
		gestion: "",
		estado: "",
		paralelo: "",
		periodo: "",
		sortBy: "fecha_inscripcion",
		sortOrder: "DESC",
		page: 1,
		limit: 10,
	});

	// Estado separado para el input de búsqueda (sin debounce)
	const [searchInput, setSearchInput] = useState("");

	// Debounce para la búsqueda
	const debouncedSearch = useDebounce(searchInput, 500);

	const [paginacion, setPaginacion] = useState({
		page: 1,
		limit: 10,
		total: 0,
		totalPages: 0,
	});

	const [estadisticas, setEstadisticas] = useState({
		resumen: {
			total_inscripciones: 0,
			inscritos: 0,
			aprobados: 0,
			reprobados: 0,
			abandonados: 0,
		},
		por_materia: [],
		por_paralelo: [],
	});

	// Cargar datos iniciales
	useEffect(() => {
		cargarInscripciones();
		cargarEstadisticas();
	}, [filtros]);

	// Efecto para actualizar filtros cuando cambie el debounced search
	useEffect(() => {
		setFiltros((prev) => ({
			...prev,
			search: debouncedSearch,
			page: 1,
		}));
	}, [debouncedSearch]);

	const cargarInscripciones = async () => {
		try {
			setLoading(true);
			// Map filtros keys to API expected keys
			const params = {
				estudiante: filtros.search,
				gestion: filtros.gestion,
				estado: filtros.estado,
				paralelo: filtros.paralelo,
				periodo: filtros.periodo,
				sortBy: filtros.sortBy,
				sortOrder: filtros.sortOrder,
				page: filtros.page,
				limit: filtros.limit,
			};
			const response = await dataService.inscripciones.obtenerTodas(params);
			setInscripciones(response.data);
			setPaginacion(response.pagination);
		} catch (error) {
			if (!window.__isSessionExpired) {
				notificationService.error(
					"Error al cargar inscripciones: " + error.message
				);
			}
		} finally {
			setLoading(false);
		}
	};

	const cargarEstadisticas = async () => {
		try {
			const response = await dataService.inscripciones.obtenerEstadisticas();
			setEstadisticas(response.data);
		} catch (error) {
			console.error("Error al cargar estadísticas:", error);
		}
	};

	const handleFiltroChange = (campo, valor) => {
		setFiltros((prev) => ({
			...prev,
			[campo]: valor,
			page: 1,
		}));
	};

	const handlePageChange = (newPage) => {
		setFiltros((prev) => ({
			...prev,
			page: newPage,
		}));
	};

	const handleCrearInscripcion = async (data) => {
		let loadingToast = null;
		try {
			loadingToast = notificationService.loading("Creando inscripción...");
			// Add periodo and paralelo with defaults if not present
			const payload = {
				...data,
				periodo: data.periodo || 1,
				paralelo: data.paralelo || "A",
			};
			await dataService.inscripciones.crear(payload);
			notificationService.success("Inscripción creada exitosamente");
			setShowCreateModal(false);
			cargarInscripciones();
			cargarEstadisticas();
		} catch (error) {
			if (!window.__isSessionExpired) {
				if (error.response?.status === 409) {
					notificationService.warning(
						error.response.data.message ||
							"Ya tienes registrada una inscripción para esta materia en la gestión actual"
					);
				} else {
					notificationService.error(
						"Error al crear inscripción: " + error.message
					);
				}
			}
		} finally {
			if (loadingToast) notificationService.dismissToast(loadingToast);
		}
	};

	const handleEditarInscripcion = async (data) => {
		let loadingToast = null;
		try {
			loadingToast = notificationService.loading("Actualizando inscripción...");
			// Include estado, paralelo, periodo, gestion if present in data
			const payload = {
				estado: data.estado,
				paralelo: data.paralelo,
				periodo: data.periodo,
				gestion: data.gestion,
			};
			await dataService.inscripciones.actualizar(
				selectedInscripcion.id_inscripcion,
				payload
			);
			notificationService.success("Inscripción actualizada exitosamente");
			setShowEditModal(false);
			setSelectedInscripcion(null);
			cargarInscripciones();
		} catch (error) {
			if (!window.__isSessionExpired) {
				notificationService.error(
					"Error al actualizar inscripción: " + error.message
				);
			}
		} finally {
			if (loadingToast) notificationService.dismissToast(loadingToast);
		}
	};

	const handleEliminarInscripcion = async (inscripcion) => {
		const confirmed = await notificationService.confirmDelete(
			`Inscripción de ${inscripcion.estudiante_nombre}`
		);
		if (confirmed) {
			let loadingToast = null;
			try {
				loadingToast = notificationService.loading("Eliminando inscripción...");
				await dataService.inscripciones.eliminar(inscripcion.id_inscripcion);
				notificationService.success("Inscripción eliminada exitosamente");
				cargarInscripciones();
				cargarEstadisticas();
			} catch (error) {
				if (!window.__isSessionExpired) {
					notificationService.error(
						"Error al eliminar inscripción: " + error.message
					);
				}
			} finally {
				if (loadingToast) notificationService.dismissToast(loadingToast);
			}
		}
	};

	const handleCambiarEstado = async (inscripcion, nuevoEstado) => {
		const confirmed = await notificationService.confirm({
			title: "Cambiar estado de la inscripción",
			text: `¿Está seguro de cambiar el estado de la inscripción a ${nuevoEstado}?`,
			confirmButtonText: "Sí, cambiar",
			cancelButtonText: "Cancelar",
		});

		if (confirmed) {
			let loadingToast = null;
			try {
				loadingToast = notificationService.loading("Cambiando estado...");
				await dataService.inscripciones.cambiarEstado(
					inscripcion.id_inscripcion,
					nuevoEstado
				);
				notificationService.success(
					`Estado de la inscripción cambiado a ${nuevoEstado}`
				);
				cargarInscripciones();
				cargarEstadisticas();
			} catch (error) {
				if (!window.__isSessionExpired) {
					notificationService.error(
						"Error al cambiar estado: " + error.message
					);
				}
			} finally {
				if (loadingToast) notificationService.dismissToast(loadingToast);
			}
		}
	};

	const columnas = [
		{
			key: "estudiante_nombre",
			title: "Estudiante",
			render: (inscripcion) =>
				`${inscripcion.estudiante_nombre} ${inscripcion.estudiante_apellido}`,
		},
		{
			key: "materia_nombre",
			title: "Materia",
		},
		{
			key: "gestion",
			title: "Gestión",
		},
		{
			key: "estado",
			title: "Estado",
			render: (inscripcion) => (
				<span
					className={`px-2 py-1 rounded-full text-xs font-medium ${
						inscripcion.estado === "inscrito"
							? "bg-blue-100 text-blue-800"
							: inscripcion.estado === "aprobado"
							? "bg-green-100 text-green-800"
							: inscripcion.estado === "reprobado"
							? "bg-red-100 text-red-800"
							: inscripcion.estado === "abandonado"
							? "bg-yellow-100 text-yellow-800"
							: "bg-gray-100 text-gray-800"
					}`}
				>
					{inscripcion.estado.charAt(0).toUpperCase() +
						inscripcion.estado.slice(1)}
				</span>
			),
		},
		{
			key: "acciones",
			title: "Acciones",
			render: (inscripcion) => (
				<div className="flex space-x-2">
					<Button
						size="sm"
						variant="secondary"
						onClick={async () => {
							try {
								const response = await dataService.inscripciones.obtenerDetalle(
									inscripcion.id_inscripcion
								);
								if (response.success !== false) {
									setSelectedInscripcion(response.data);

									console.log(response.data);
									setShowDetailModal(true);
								} else {
									notificationService.error(
										"Error al obtener detalle de inscripción"
									);
								}
							} catch (error) {
								notificationService.error(
									"Error al obtener detalle de inscripción: " + error.message
								);
							}
						}}
					>
						<Eye className="w-4 h-4" />
					</Button>
					<Button
						size="sm"
						variant="secondary"
						onClick={async () => {
							try {
								const response = await dataService.inscripciones.obtenerDetalle(
									inscripcion.id_inscripcion
								);
								if (response.success !== false) {
									setSelectedInscripcion(response.data);
									setShowEditModal(true);
								} else {
									notificationService.error(
										"Error al obtener detalle de inscripción"
									);
								}
							} catch (error) {
								notificationService.error(
									"Error al obtener detalle de inscripción: " + error.message
								);
							}
						}}
					>
						<Edit className="w-4 h-4" />
					</Button>
					<Button
						size="sm"
						variant="danger"
						onClick={() => handleEliminarInscripcion(inscripcion)}
					>
						<Trash2 className="w-4 h-4" />
					</Button>
				</div>
			),
		},
	];

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
				<div>
					<h1 className="text-2xl sm:text-2xl font-bold text-secondary-900">
						Gestión de Inscripciones
					</h1>
					<p className="text-secondary-600 mt-1">
						Administra las inscripciones del sistema
					</p>
				</div>
				<Button
					onClick={() => setShowCreateModal(true)}
					className="w-full sm:w-auto"
				>
					<Plus className="w-4 h-4 mr-2" />
					Nueva Inscripción
				</Button>
			</div>

			{/* Estadísticas */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
				<Card className="p-4">
					<div className="flex items-center">
						<ClipboardList className="w-8 h-8 text-blue-600" />
						<div className="ml-4">
							<p className="text-sm font-medium text-secondary-600">
								Total Inscripciones
							</p>
							<p className="text-2xl font-bold text-secondary-900">
								{estadisticas.resumen?.total_inscripciones || 0}
							</p>
						</div>
					</div>
				</Card>
				<Card className="p-4">
					<div className="flex items-center">
						<UserCheck className="w-8 h-8 text-green-600" />
						<div className="ml-4">
							<p className="text-sm font-medium text-secondary-600">
								Inscritos
							</p>
							<p className="text-2xl font-bold text-secondary-900">
								{estadisticas.resumen?.inscritos || 0}
							</p>
						</div>
					</div>
				</Card>
				<Card className="p-4">
					<div className="flex items-center">
						<Calendar className="w-8 h-8 text-purple-600" />
						<div className="ml-4">
							<p className="text-sm font-medium text-secondary-600">
								Aprobados
							</p>
							<p className="text-2xl font-bold text-secondary-900">
								{estadisticas.resumen?.aprobados || 0}
							</p>
						</div>
					</div>
				</Card>
				<Card className="p-4">
					<div className="flex items-center">
						<ClipboardList className="w-8 h-8 text-red-600" />
						<div className="ml-4">
							<p className="text-sm font-medium text-secondary-600">
								Reprobados
							</p>
							<p className="text-2xl font-bold text-secondary-900">
								{estadisticas.resumen?.reprobados || 0}
							</p>
						</div>
					</div>
				</Card>
			</div>

			{/* Filtros */}
			<Card className="p-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
					<div className="sm:col-span-2 lg:col-span-1">
						<Input
							placeholder="Buscar por estudiante o materia..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							icon={<Search className="w-4 h-4" />}
							size="md"
						/>
					</div>
					<div>
						<select
							className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
							value={filtros.gestion}
							onChange={(e) => handleFiltroChange("gestion", e.target.value)}
						>
							<option value="">Todas las gestiones</option>
							{(() => {
								const currentYear = new Date().getFullYear();
								return [
									`${currentYear}`,
									`${currentYear - 1}`,
									`${currentYear + 1}`,
								].map((gestion) => (
									<option key={gestion} value={gestion}>
										{gestion}
									</option>
								));
							})()}
						</select>
					</div>
					<div>
						<select
							className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
							value={filtros.estado}
							onChange={(e) => handleFiltroChange("estado", e.target.value)}
						>
							<option value="">Todos los estados</option>
							<option value="inscrito">Inscrito</option>
							<option value="aprobado">Aprobado</option>
							<option value="reprobado">Reprobado</option>
							<option value="abandonado">Abandonado</option>
						</select>
					</div>
					<div>
						<select
							className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
							value={filtros.paralelo}
							onChange={(e) => handleFiltroChange("paralelo", e.target.value)}
						>
							<option value="">Todos los paralelos</option>
							<option value="A">Paralelo A</option>
							<option value="B">Paralelo B</option>
							<option value="C">Paralelo C</option>
							<option value="D">Paralelo D</option>
						</select>
					</div>
					<div>
						<select
							className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
							value={filtros.periodo}
							onChange={(e) => handleFiltroChange("periodo", e.target.value)}
						>
							<option value="">Todos los periodos</option>
							<option value="1">Primero</option>
							<option value="2">Segundo</option>
							<option value="3">Verano</option>
							<option value="4">Invierno</option>
						</select>
					</div>
					<div>
						<select
							className="w-full h-12 px-4 py-3 text-base border border-secondary-300 bg-white text-secondary-900 placeholder-secondary-400 rounded-lg focus:outline-none focus:ring-2 focus:border-primary-500 focus:ring-primary-500/20 transition-colors duration-200"
							value={filtros.limit}
							onChange={(e) =>
								handleFiltroChange("limit", parseInt(e.target.value))
							}
						>
							<option value={10}>10 por página</option>
							<option value={25}>25 por página</option>
							<option value={50}>50 por página</option>
							<option value={100}>100 por página</option>
						</select>
					</div>
				</div>
			</Card>

			{/* Tabla */}
			<Card className="p-4">
				{loading ? (
					<div className="flex justify-center items-center py-8">
						<Loading />
					</div>
				) : (
					<>
						<DataTable
							data={inscripciones}
							columns={columnas}
							loading={loading}
							onRowClick={null}
							responsive={true}
						/>
						<div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-secondary-200">
							<Button
								variant="secondary"
								disabled={paginacion.page <= 1}
								onClick={() => handlePageChange(paginacion.page - 1)}
								className="w-full sm:w-auto"
							>
								Anterior
							</Button>
							<span className="text-sm sm:text-base font-medium text-secondary-700 order-first sm:order-none">
								Página {paginacion.page} de {paginacion.totalPages}
							</span>
							<Button
								variant="secondary"
								disabled={paginacion.page >= paginacion.totalPages}
								onClick={() => handlePageChange(paginacion.page + 1)}
								className="w-full sm:w-auto"
							>
								Siguiente
							</Button>
						</div>
					</>
				)}
			</Card>

			{/* Modales */}
			<Modal
				isOpen={showCreateModal}
				onClose={() => setShowCreateModal(false)}
				title="Crear Nueva Inscripción"
				size="xl"
			>
				<InscripcionForm
					onSubmit={handleCrearInscripcion}
					onCancel={() => setShowCreateModal(false)}
				/>
			</Modal>

			<Modal
				isOpen={showEditModal}
				onClose={() => {
					setShowEditModal(false);
					setSelectedInscripcion(null);
				}}
				title="Editar Inscripción"
				size="xl"
			>
				{selectedInscripcion && (
					<InscripcionForm
						inscripcion={selectedInscripcion}
						onSubmit={handleEditarInscripcion}
						onCancel={() => {
							setShowEditModal(false);
							setSelectedInscripcion(null);
						}}
						isEdit={true}
					/>
				)}
			</Modal>

			<Modal
				isOpen={showDetailModal}
				onClose={() => {
					setShowDetailModal(false);
					setSelectedInscripcion(null);
				}}
				title="Detalle de la Inscripción"
				size="xl"
			>
				{selectedInscripcion && (
					<InscripcionDetalle
						inscripcion={selectedInscripcion}
						onClose={() => {
							setShowDetailModal(false);
							setSelectedInscripcion(null);
						}}
						onCambiarEstado={handleCambiarEstado}
					/>
				)}
			</Modal>
		</div>
	);
};

export default InscripcionesPage;
