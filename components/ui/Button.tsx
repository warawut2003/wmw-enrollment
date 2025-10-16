import React from "react";
import Spinner from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: "primary" | "secondary" | "danger";
    isLoading?: boolean;
}

const Button = ({
    children,
    variant = "primary", // กำหนดค่า default เป็น 'primary'
    isLoading = false,
    className,
    ...props
}: ButtonProps) => {
    const baseStyle = "w-full py-2 px-4 font-semibold rounded-md shadow-sm transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variantStyles = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    };

    const disabledStyle = "disabled:bg-gray-400 disabled:cursor-not-allowed";

    const combinedClassName = `
    ${baseStyle}
    ${variantStyles[variant]}
    ${disabledStyle}
    ${className}
  `;

    return (
        <button className={combinedClassName.trim()} disabled={isLoading || props.disabled} {...props}>
            {isLoading ? (
            <div className="flex items-center justify-center">
                <Spinner size="sm" className="text-white" />
            </div>
        ) : (
            children
        )}</button>
    )
};
export default Button;