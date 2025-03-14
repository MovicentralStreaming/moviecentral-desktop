import React, { ReactNode } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  beforeContent?: ReactNode;
};

const Input: React.FC<InputProps> = ({ beforeContent, className = "", ...props }) => {
  return (
    <div className={`rounded-md transition-colors focus-within:border-white flex gap-2 p-2 py-1.5 items-center ${className}`}>
      {beforeContent}
      <input {...props} className={`w-full focus:outline-0`} />
    </div>
  );
};

export default Input;
