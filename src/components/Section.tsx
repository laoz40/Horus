import "./Section.css";

interface SectionProps {
	header: string;
	bg?: boolean;
	children: React.ReactNode;
	id: string;
}

const Section = ({ header, bg, children, id }: SectionProps) => {
	return (
		<section
			id={id}
			className="section-container">
			<h2 className="section-header-text">{header}</h2>
			<div 
				className={bg ? "section-content-bg" : "section-content"}>{children}</div>
		</section>
	);
};

export default Section;
