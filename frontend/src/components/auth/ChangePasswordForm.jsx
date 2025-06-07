import React, { useState, useCallback } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../ui/Button";
import PasswordInput from "../ui/PasswordInput";
import { useFormValidation, commonRules } from "../../utils/validation";
import { notificationService } from "../../services/notificationService";

const ChangePasswordForm = ({ onSuccess, onCancel }) => {
	const { changePassword } = useAuth();
	const [formData, setFormData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [currentPasswordError, setCurrentPasswordError] = useState("");

	const { validateField, validate, getFieldError } = useFormValidation({
		currentPassword: [commonRules.required],
		newPassword: [
			(value) => {
				if (!value) return "Este campo es requerido";
				if (value.length < 8)
					return "Mínimo 8 caracteres, mayúscula, minúscula y número";
				if (!/[A-Z]/.test(value))
					return "Mínimo 8 caracteres, mayúscula, minúscula y número";
				if (!/[a-z]/.test(value))
					return "Mínimo 8 caracteres, mayúscula, minúscula y número";
				if (!/\d/.test(value))
					return "Mínimo 8 caracteres, mayúscula, minúscula y número";
				return null;
			},
		],
		confirmPassword: [
			commonRules.required,
			(value) => {
				if (value !== formData.newPassword) {
					return "Las contraseñas no coinciden";
				}
				return null;
			},
		],
	});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Clear API error when user types in current password field
		if (name === "currentPassword") {
			setCurrentPasswordError("");
		}

		validateField(name, value, true);
	};

	const handleSubmit = useCallback(
		async (e) => {
			e.preventDefault();

			// Clear any previous API errors
			setCurrentPasswordError("");

			if (!validate(formData)) {
				Object.keys(formData).forEach((fieldName) => {
					validateField(fieldName, formData[fieldName], true);
				});
				return;
			}

			const confirmed = await notificationService.confirm({
				title: "Cambiar Contraseña",
				text: "¿Estás seguro de que deseas cambiar tu contraseña?",
				confirmButtonText: "Sí, cambiar",
				cancelButtonText: "Cancelar",
			});

			if (!confirmed) {
				return;
			}

			setIsLoading(true);

			try {
				const result = await changePassword({
					password_actual: formData.currentPassword,
					password_nueva: formData.newPassword,
				});

				if (result.success) {
					notificationService.success("¡Contraseña cambiada exitosamente!");
					setFormData({
						currentPassword: "",
						newPassword: "",
						confirmPassword: "",
					});

					if (onSuccess) {
						onSuccess();
					}
				} else {
					// Handle API error response
					setCurrentPasswordError("Contraseña actual incorrecta");
					notificationService.error(
						result.message || "Error al cambiar la contraseña"
					);
				}
			} catch (error) {
				// Handle network or other errors
				notificationService.error("Error al conectar con el servidor");
			} finally {
				setIsLoading(false);
			}
		},
		[validate, formData, changePassword, onSuccess]
	);

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-6 w-full max-w-md mx-auto px-4 sm:px-0"
			noValidate
		>
			<PasswordInput
				label="Contraseña Actual"
				name="currentPassword"
				value={formData.currentPassword}
				onChange={handleChange}
				onBlur={(e) => validateField("currentPassword", e.target.value, true)}
				placeholder="Ingresa tu contraseña actual"
				icon={<Lock />}
				error={currentPasswordError || getFieldError("currentPassword")}
				required
				autoComplete="current-password"
				className="w-full sm:w-[400px]"
			/>

			<PasswordInput
				label="Nueva Contraseña"
				name="newPassword"
				value={formData.newPassword}
				onChange={handleChange}
				onBlur={(e) => validateField("newPassword", e.target.value, true)}
				placeholder="Mín. 8 caracteres, mayús., minús. y número"
				icon={<Lock />}
				error={getFieldError("newPassword")}
				helperText="La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
				required
				autoComplete="new-password"
				minLength={8}
				pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
				className="w-full sm:w-[400px]"
			/>

			<PasswordInput
				label="Confirmar Nueva Contraseña"
				name="confirmPassword"
				value={formData.confirmPassword}
				onChange={handleChange}
				onBlur={(e) => validateField("confirmPassword", e.target.value, true)}
				placeholder="Repite tu nueva contraseña"
				icon={<Lock />}
				error={getFieldError("confirmPassword")}
				required
				autoComplete="new-password"
				className="w-full sm:w-[400px]"
			/>

			<div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-3">
				{onCancel && (
					<Button
						type="button"
						variant="secondary"
						onClick={onCancel}
						disabled={isLoading}
					>
						Cancelar
					</Button>
				)}

				<Button type="submit" loading={isLoading} disabled={isLoading}>
					{isLoading ? "Cambiando..." : "Cambiar Contraseña"}
				</Button>
			</div>
		</form>
	);
};

export default ChangePasswordForm;
