import { Link } from 'react-router-dom';
import logoImg from '@/assets/logo.jpg';

type Props = {
  showText?: boolean;
  className?: string;
  imageClassName?: string;
};

const Logo = ({ showText = true, className = '', imageClassName = 'h-9 w-9' }: Props) => (
  <Link to="/" className={`flex items-center space-x-2 ${className}`}>
    <img
      src={logoImg}
      alt="Mindful logo"
      className={`rounded-full object-cover ${imageClassName}`}
    />
    {showText && <span className="font-bold text-xl">Mindful</span>}
  </Link>
);

export default Logo;
