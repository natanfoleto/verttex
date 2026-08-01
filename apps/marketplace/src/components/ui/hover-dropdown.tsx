"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface HoverDropdownProps {
  /** O elemento acionador (botão ou link) */
  trigger: React.ReactNode;
  /** O conteúdo interno do menu suspenso */
  children: React.ReactNode;
  /** Alinhamento do menu em relação ao acionador: "left" ou "right" */
  align?: "left" | "right";
  /** Classe de borda para a flechinha indicadora no topo (ex: "border-b-[#333333]" ou "border-b-white") */
  arrowColor?: string;
  /** Posição horizontal da flechinha (ex: "left-6" ou "right-6") */
  arrowOffset?: string;
  /** Classes CSS adicionais para o container pai */
  containerClassName?: string;
  /** Classes CSS adicionais para o wrapper do conteúdo */
  contentClassName?: string;
}

export function HoverDropdown({
  trigger,
  children,
  align = "left",
  arrowColor,
  arrowOffset = "left-6",
  containerClassName,
  contentClassName,
}: HoverDropdownProps) {
  return (
    <div className={cn("relative group", containerClassName)}>
      {trigger}

      <div
        className={cn(
          "invisible absolute top-full opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 z-50 font-sans",
          align === "right" ? "right-0" : "left-0"
        )}
      >
        <div className="relative pt-2">
          {arrowColor && (
            <div
              className={cn(
                "absolute top-0 w-0 h-0 border-l-[9px] border-r-[9px] border-b-[9px] border-l-transparent border-r-transparent z-10",
                arrowOffset,
                arrowColor
              )}
            />
          )}
          <div className={contentClassName}>{children}</div>
        </div>
      </div>
    </div>
  );
}
