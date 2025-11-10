import "./Input.css";

interface InputProps {
	type?: string;
	placeholder?: string;
	id?: string;
}

const Input = ({type, placeholder, id}: InputProps) => {
	return (
		<input
			type={type}
			placeholder={placeholder}
			className="input"
			id={id}
		/>
	);
};

export default Input;
