import '../styles/titlebar.css';

interface TitleBarProps {
  title: string;
}

export function TitleBar({ title }: TitleBarProps) {
  return (
    <div className="titlebar">
      <div className="titlebar__traffic-lights">
        <span className="titlebar__dot titlebar__dot--red" />
        <span className="titlebar__dot titlebar__dot--yellow" />
        <span className="titlebar__dot titlebar__dot--green" />
      </div>
      <span className="titlebar__title">{title}</span>
    </div>
  );
}
