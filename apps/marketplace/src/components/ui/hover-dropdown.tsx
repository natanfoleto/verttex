'use client'

import React from 'react'

import { cn } from '@/lib/utils'

export interface HoverDropdownProps {
  /** O elemento acionador (botão ou link) */
  trigger: React.ReactNode
  /** O conteúdo interno do menu suspenso */
  children: React.ReactNode
  /** Alinhamento do menu em relação ao acionador: "left" ou "right" (para posição bottom) */
  align?: 'left' | 'right'
  /** Posição do menu em relação ao acionador: "bottom" (padrão) ou "right" */
  position?: 'bottom' | 'right'
  /** Exibir ou oculta a seta indicadora */
  showArrow?: boolean
  /** Posição horizontal da flechinha (ex: "left-6" ou "right-6") */
  arrowOffset?: string
  /** Identificador de grupo de hover ("main" ou "sub") para separar o menu principal de submenus */
  groupId?: 'main' | 'sub'
  /** Classes CSS adicionais para o container pai */
  containerClassName?: string
  /** Classes CSS adicionais para o wrapper do conteúdo */
  contentClassName?: string
}

const groupStyles = {
  main: {
    container: 'group/main',
    hover: 'group-hover/main:visible group-hover/main:opacity-100',
  },
  sub: {
    container: 'group/sub',
    hover: 'group-hover/sub:visible group-hover/sub:opacity-100',
  },
}

export function HoverDropdown({
  trigger,
  children,
  align = 'left',
  position = 'bottom',
  showArrow = true,
  arrowOffset = 'left-6',
  groupId = 'main',
  containerClassName,
  contentClassName,
}: HoverDropdownProps) {
  const currentGroup = groupStyles[groupId] || groupStyles.main

  return (
    <div className={cn('relative', currentGroup.container, containerClassName)}>
      {trigger}

      <div
        className={cn(
          'invisible absolute z-50 font-sans opacity-0 transition-all duration-150',
          currentGroup.hover,
          position === 'right'
            ? 'top-1/2 left-full -translate-y-1/2 pl-0.5'
            : cn('top-full', align === 'right' ? 'right-0' : 'left-0'),
        )}
      >
        <div
          className={cn(
            'relative',
            position === 'bottom' && showArrow && 'pt-2',
          )}
        >
          {/* Flecha indicadora com cor branca fixa (#ffffff) mantida no componente */}
          {position === 'bottom' && showArrow && (
            <div
              className={cn(
                'absolute top-0 z-10 h-0 w-0 border-r-[9px] border-b-[9px] border-l-[9px] border-r-transparent border-b-white border-l-transparent',
                arrowOffset,
              )}
            />
          )}
          {/* Container do conteúdo com fundo e bordas brancos por padrão */}
          <div
            className={cn(
              'overflow-hidden rounded-xs bg-white font-sans shadow-md',
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
