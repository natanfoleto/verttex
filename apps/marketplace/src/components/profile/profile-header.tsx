"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiLockPasswordLine, RiMapPinLine, RiUser3Line } from "react-icons/ri";

export function ProfileHeader() {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Dados Pessoais",
      href: "/perfil",
      icon: RiUser3Line,
      isActive: pathname === "/perfil",
    },
    {
      label: "Endereços de Entrega",
      href: "/perfil/enderecos",
      icon: RiMapPinLine,
      isActive: pathname === "/perfil/enderecos",
    },
    {
      label: "Alterar Senha",
      href: "/perfil/alterar-senha",
      icon: RiLockPasswordLine,
      isActive: pathname === "/perfil/alterar-senha",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900">
          Minha Conta de Cliente
        </h1>
        <p className="mt-1 text-xs text-stone-500">
          Gerencie suas informações cadastrais, endereços e segurança na VERTTEX.
        </p>
      </div>

      {/* Standardized Tab Navigation Bar */}
      <div className="border-b border-stone-200">
        <nav className="-mb-px flex space-x-8 text-xs font-semibold" aria-label="Abas do Perfil">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center space-x-2 border-b-2 px-1 pb-3 pt-1 transition-colors cursor-pointer ${
                  tab.isActive
                    ? "border-emerald-700 font-bold text-emerald-800"
                    : "border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-900"
                }`}
              >
                <Icon className={`h-4 w-4 ${tab.isActive ? "text-emerald-700" : "text-stone-400"}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
