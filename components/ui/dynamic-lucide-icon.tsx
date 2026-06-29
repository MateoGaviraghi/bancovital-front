'use client';

import {
  Activity,
  Beaker,
  Bug,
  Droplets,
  Eye,
  FileHeart,
  FlaskConical,
  FlaskRound,
  Heart,
  HeartPulse,
  Leaf,
  Microscope,
  PawPrint,
  Pill,
  Pipette,
  Rat,
  Ribbon,
  ScanEye,
  Shield,
  Skull,
  Stethoscope,
  Syringe,
  TestTube,
  TestTubes,
  Thermometer,
  TreePine,
  Vegan,
  Wheat,
  Zap,
} from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  'paw-print': PawPrint,
  droplets: Droplets,
  'flask-conical': FlaskConical,
  'flask-round': FlaskRound,
  microscope: Microscope,
  heart: Heart,
  'heart-pulse': HeartPulse,
  activity: Activity,
  syringe: Syringe,
  'test-tube': TestTube,
  'test-tubes': TestTubes,
  pill: Pill,
  thermometer: Thermometer,
  beaker: Beaker,
  pipette: Pipette,
  eye: Eye,
  'scan-eye': ScanEye,
  bug: Bug,
  rat: Rat,
  leaf: Leaf,
  'tree-pine': TreePine,
  wheat: Wheat,
  vegan: Vegan,
  ribbon: Ribbon,
  shield: Shield,
  skull: Skull,
  zap: Zap,
  'file-heart': FileHeart,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export function DynamicLucideIcon({
  name,
  ...props
}: { name: string | null | undefined } & Omit<LucideProps, 'name'>) {
  if (!name) return null;
  const Icon = ICON_MAP[name];
  return Icon ? <Icon {...props} /> : null;
}
