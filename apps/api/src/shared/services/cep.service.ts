import { AppError } from "../errors/app-error";

export interface CepLookupResult {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export class CepService {
  /**
   * Looks up Brazilian ZipCode (CEP) using ViaCEP with fallback to BrasilAPI
   */
  static async lookup(rawZipCode: string): Promise<CepLookupResult> {
    const cleanZipCode = rawZipCode.replace(/\D/g, "");
    if (cleanZipCode.length !== 8) {
      throw new AppError("VALIDATION_ERROR", "CEP deve conter exatamente 8 dígitos numéricos", 400);
    }

    // Try ViaCEP first
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanZipCode}/json/`, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data && !data.erro) {
          return {
            zipCode: cleanZipCode,
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
          };
        }
      }
    } catch {
      // Fallthrough to fallback provider
    }

    // Fallback: BrasilAPI
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanZipCode}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = (await response.json()) as any;
        if (data) {
          return {
            zipCode: cleanZipCode,
            street: data.street || "",
            neighborhood: data.neighborhood || "",
            city: data.city || "",
            state: data.state || "",
          };
        }
      }
    } catch {
      // Fallthrough
    }

    throw new AppError("NOT_FOUND", "CEP não encontrado ou serviço indisponível no momento", 404);
  }
}
