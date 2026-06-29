import type { Metadata } from "next";
import { Simulator } from "@/components/Simulator";

export const metadata: Metadata = {
  title: "Simulateur de devis · NeoTravel",
  description:
    "Composez votre trajet et voyez le devis se recomposer en direct, ligne par ligne. Calcul 100 % déterministe, identique au moteur de production.",
};

export default function DevisPage() {
  return <Simulator />;
}
