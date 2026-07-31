"use client";

import { useRef, useState } from "react";
import { RiPaletteLine, RiCheckLine } from "react-icons/ri";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

// Paleta de cores populares do Tailwind CSS para escolha rápida
const TAILWIND_PRESET_COLORS = [
  { name: "Verde Esmeralda", hex: "#16a34a" },
  { name: "Verde Floresta", hex: "#15803d" },
  { name: "Azul Escuro", hex: "#0f172a" },
  { name: "Azul Real", hex: "#2563eb" },
  { name: "Ciano", hex: "#0891b2" },
  { name: "Âmbar / Amarelo", hex: "#d97706" },
  { name: "Laranja", hex: "#ea580c" },
  { name: "Rosa / Carmim", hex: "#e11d48" },
  { name: "Violeta", hex: "#7c3aed" },
  { name: "Pedra Muted", hex: "#f5f5f4" },
  { name: "Cinza Neutro", hex: "#78716c" },
  { name: "Escuro / Chumbo", hex: "#1c1917" },
  { name: "Branco Puro", hex: "#ffffff" },
  { name: "Preto", hex: "#000000" },
];

export function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  const nativePickerRef = useRef<HTMLInputElement>(null);
  const [showPresets, setShowPresets] = useState(false);

  const currentColor = value || "#000000";

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-300">{label}</label>
        {description && <span className="text-[11px] text-zinc-500">{description}</span>}
      </div>

      <div className="flex items-center gap-2 w-full">
        {/* Botão de Amostra + Disparador do Seletor Nativo */}
        <button
          type="button"
          onClick={() => nativePickerRef.current?.click()}
          className="relative size-9 shrink-0 rounded-lg border border-zinc-700 shadow-xs cursor-pointer overflow-hidden transition-transform active:scale-95 flex items-center justify-center"
          style={{ backgroundColor: currentColor }}
          title="Clique para abrir o seletor de cores"
        >
          <input
            ref={nativePickerRef}
            type="color"
            value={currentColor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer size-full"
          />
        </button>

        {/* Campo de Texto Hexadecimal */}
        <input
          type="text"
          value={currentColor}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="h-9 flex-1 min-w-0 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 text-xs font-mono text-zinc-100 uppercase focus:border-emerald-500 focus:outline-hidden"
        />

        {/* Botão para Alternar a Paleta de Cores Tailwind Rápida */}
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className={`h-9 px-3 rounded-lg border text-xs font-medium gap-1.5 flex items-center shrink-0 cursor-pointer transition-colors ${
            showPresets
              ? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
              : "border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          }`}
        >
          <RiPaletteLine className="h-3.5 w-3.5" />
          <span>Paleta</span>
        </button>
      </div>

      {/* Grade de Cores Pré-definidas do Tailwind */}
      {showPresets && (
        <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="text-[11px] font-semibold text-zinc-400">Cores Recomendadas:</p>
          <div className="grid grid-cols-7 gap-1.5">
            {TAILWIND_PRESET_COLORS.map((color) => {
              const isSelected = color.hex.toLowerCase() === currentColor.toLowerCase();
              return (
                <button
                  key={color.hex}
                  type="button"
                  title={`${color.name} (${color.hex})`}
                  onClick={() => {
                    onChange(color.hex);
                    setShowPresets(false);
                  }}
                  className="group relative size-7 rounded-md border border-zinc-700/80 cursor-pointer flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: color.hex }}
                >
                  {isSelected && (
                    <RiCheckLine
                      className={`h-3.5 w-3.5 ${
                        color.hex.toLowerCase() === "#ffffff" ? "text-black" : "text-white"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
