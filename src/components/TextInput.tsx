import "./TextInput.css";

interface TextInputProps {
	id?: string;
	label: React.ReactNode;
}

const TextInput = ({ id, label }: TextInputProps) => {

	return (
		<div className="input-container">
			<input
				id={id}
				className="animated-input"
				placeholder=" "
				type="text"></input>
			<label htmlFor={id}>{label}</label>
			<span className="focus-border">
				<i></i>
			</span>
		</div>
	);
};

export default TextInput;
