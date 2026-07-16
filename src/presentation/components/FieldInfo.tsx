import type { FieldError } from "react-hook-form";

type FieldInfoProps = {
  error?: FieldError;
  id: string;
};

const FieldInfo = ({ error, id }: FieldInfoProps) => {
  if (!error?.message) return null;

  return (
    <p id={id} className="label text-error" role="alert">
      {error.message}
    </p>
  );
};

export default FieldInfo;
