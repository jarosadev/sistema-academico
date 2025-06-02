import { useState, useCallback } from 'react';

export function useForm({ initialValues, validate, onSubmit }) {
  const [values, setValues] = useState(initialValues || {});
  const [errors, setErrors] = useState({});

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setValues((prevValues) => ({
      ...prevValues,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      if (event) event.preventDefault();
      if (validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
          return;
        }
      }
      if (onSubmit) {
        await onSubmit(values);
      }
    },
    [values, validate, onSubmit]
  );

  return {
    values,
    setValues,
    errors,
    setErrors,
    handleChange,
    handleSubmit,
  };
}
