
import { Droplet, Zap, Stethoscope, GraduationCap, Trash2 as TrashIcon, Building, Bus, Building2, Leaf, DollarSign } from "lucide-react";

export const departments = [
  {
    id: "water",
    name: "Water Supply",
    icon: "W",
    iconComponent: Droplet,
    color: "blue",
    description: "Responsible for clean water distribution, maintenance of water infrastructure, and quality testing.",
    requestCount: 0
  },
  {
    id: "electricity",
    name: "Electricity",
    icon: "E",
    iconComponent: Zap,
    color: "yellow",
    description: "Manages power distribution, electrical infrastructure, and handles power-related complaints.",
    requestCount: 0
  },
  {
    id: "health",
    name: "Health",
    icon: "H",
    iconComponent: Stethoscope,
    color: "red", 
    description: "Oversees public health initiatives, medical facilities, and healthcare programs across the city.",
    requestCount: 0
  },
  {
    id: "education",
    name: "Education",
    icon: "E",
    iconComponent: GraduationCap,
    color: "green",
    description: "Responsible for schools, educational programs, teacher training, and academic infrastructure.",
    requestCount: 0
  },
  {
    id: "sanitation",
    name: "Sanitation",
    icon: "S",
    iconComponent: TrashIcon,
    color: "purple",
    description: "Handles waste management, sewage systems, and maintains cleanliness throughout the city.",
    requestCount: 0
  },
  {
    id: "public-works",
    name: "Public Works",
    icon: "P",
    iconComponent: Building,
    color: "gray",
    description: "Oversees construction and maintenance of roads, bridges, buildings and other public infrastructure.",
    requestCount: 0
  },
  {
    id: "transportation",
    name: "Transportation",
    icon: "T",
    iconComponent: Bus,
    color: "orange",
    description: "Manages public transit systems, traffic management, and transportation infrastructure.",
    requestCount: 0
  },
  {
    id: "urban-development",
    name: "Urban Development",
    icon: "U",
    iconComponent: Building2,
    color: "indigo",
    description: "Plans and implements city development projects, zoning regulations, and urban renewal.",
    requestCount: 0
  },
  {
    id: "environment",
    name: "Environment",
    icon: "E",
    iconComponent: Leaf,
    color: "teal",
    description: "Focuses on environmental protection, green initiatives, and sustainability programs.",
    requestCount: 0
  },
  {
    id: "finance",
    name: "Finance",
    icon: "F",
    iconComponent: DollarSign,
    color: "blue",
    description: "Manages city budget, revenue collection, financial planning, and expenditure control.",
    requestCount: 0
  }
];
