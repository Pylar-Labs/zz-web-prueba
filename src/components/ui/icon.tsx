import {
  ShoppingBag,
  Truck,
  Gift,
  Leaf,
  Star,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  type LucideProps,
} from "lucide-react";

const icons = {
  ShoppingBag,
  Truck,
  Gift,
  Leaf,
  Star,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
} as const;

export type IconName = keyof typeof icons;

interface IconProps extends LucideProps {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const LucideIcon = icons[name];
  return <LucideIcon {...props} />;
}
