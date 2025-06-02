import React from 'react';

const Toggle = ({ label, checked, onChange, name, disabled = false }) => {
    return (
        <label className="flex items-center cursor-pointer">
            {label && (
                <span className="text-sm font-medium text-secondary-700 mr-3">
                    {label}
                </span>
            )}
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    name={name}
                    disabled={disabled}
                />
                <div
                    className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out ${
                        checked ? 'bg-primary-500' : 'bg-secondary-200'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <div
                    className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out ${
                        checked ? 'transform translate-x-6' : 'transform translate-x-0'
                    }`}
                />
            </div>
        </label>
    );
};

export default Toggle;
