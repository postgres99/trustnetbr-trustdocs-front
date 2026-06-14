import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

export type SupportedLocale = "pt-BR" | "en-US";

const messages = {
  "pt-BR": {
    "common.active": "Ativo",
    "common.inactive": "Inativo",
    "common.cancel": "Cancelar",
    "common.save": "Salvar",
    "common.saving": "Salvando...",
    "common.edit": "Editar",
    "common.delete": "Excluir",
    "common.search": "Buscar",
    "common.refresh": "Atualizar",
    "common.back": "Voltar",
    "common.close": "Fechar",
    "common.add": "Adicionar",
    "common.remove": "Remover",
    "common.required": "Obrigatório",
    "common.optional": "Opcional",
    "common.copy": "Copiar",
    "common.copied": "Copiado",
    "common.yes": "Sim",
    "common.no": "Não",
    "common.noDeadline": "Sem prazo",
    "common.notProvided": "Não informado",
    "nav.dashboard": "Visão geral",
    "nav.myRequests": "Minhas solicitações",
    "nav.requests": "Solicitações",
    "nav.clients": "Clientes",
    "nav.catalogs": "Catálogos",
    "nav.users": "Usuários",
    "nav.settings": "Configurações",
    "nav.logout": "Sair",
    "nav.systemOnline": "Sistema online",
    "nav.systemOffline": "Sistema indisponível",
    "auth.secureDocuments": "Gestão segura de documentos",
    "auth.hero": "Documentos organizados. Acessos sob controle.",
    "auth.description":
      "Centralize solicitações, acompanhe envios e revise documentos em um único ambiente por empresa.",
    "auth.security": "Permissões por perfil e isolamento por empresa",
    "auth.title": "Acesse sua conta",
    "auth.subtitle": "Use suas credenciais para continuar.",
    "auth.email": "E-mail",
    "auth.emailPlaceholder": "nome@empresa.com",
    "auth.password": "Senha",
    "auth.passwordPlaceholder": "Sua senha",
    "auth.showPassword": "Mostrar senha",
    "auth.hidePassword": "Ocultar senha",
    "auth.forgot": "Esqueci minha senha",
    "auth.recoveryTitle": "Recuperação de acesso",
    "auth.recoveryDescription":
      "Entre em contato com o administrador da sua empresa para receber uma senha temporária.",
    "auth.recoverySecurity":
      "Por segurança, a redefinição é registrada no histórico de auditoria do usuário.",
    "auth.login": "Entrar",
    "auth.loggingIn": "Entrando...",
    "auth.sessionExpired": "Sua sessão expirou. Entre novamente para continuar.",
    "auth.twoFactor": "Esta conta requer autenticação em dois fatores.",
    "auth.apiUnavailable": "API indisponível",
    "auth.apiHealthy": "API e banco {status}",
    "dashboard.hello": "Olá, {name}",
    "dashboard.subtitle": "Acompanhe o trabalho recente da sua empresa.",
    "dashboard.newRequest": "Nova solicitação",
    "dashboard.waiting": "Aguardando envio",
    "dashboard.openRequests": "Solicitações abertas",
    "dashboard.reviewing": "Em análise",
    "dashboard.received": "Documentos recebidos",
    "dashboard.approved": "Aprovadas",
    "dashboard.completed": "Concluídas",
    "dashboard.resubmission": "Reenvio solicitado",
    "dashboard.attention": "Precisam de atenção",
    "dashboard.recent": "Solicitações recentes",
    "dashboard.recentSubtitle": "Últimas movimentações disponíveis para o seu perfil.",
    "dashboard.viewAll": "Ver todas",
    "roles.systemAdmin": "Administrador do sistema",
    "roles.tenantAdmin": "Administrador da empresa",
    "roles.user": "Usuário",
    "requests.documents": "Documentos",
    "requests.mineSubtitle": "Acompanhe as solicitações criadas por você.",
    "requests.allSubtitle":
      "Acompanhe os envios e o andamento dos documentos da empresa.",
    "requests.loading": "Carregando solicitações...",
    "requests.loadError": "Não foi possível carregar os dados",
    "requests.retry": "Tentar novamente",
    "requests.searchPlaceholder":
      "Buscar por cliente, modelo, status ou número",
    "requests.statusFilter": "Filtrar por status",
    "requests.allStatuses": "Todos os status",
    "requests.from": "De",
    "requests.to": "Até",
    "requests.clearFilters": "Limpar",
    "requests.resultCount": "{count} resultado(s)",
    "requests.none": "Nenhuma solicitação encontrada",
    "requests.noResults": "Nenhum resultado encontrado",
    "requests.noResultsHint":
      "Ajuste os termos da busca para localizar outra solicitação.",
    "requests.emptyHint":
      "Crie a primeira solicitação para iniciar o fluxo de documentos.",
    "requests.create": "Criar solicitação",
    "requests.request": "Solicitação",
    "requests.client": "Cliente",
    "requests.status": "Status",
    "requests.createdAt": "Criada em",
    "requests.submittedAt": "Enviada em",
    "requests.open": "Abrir solicitação {id}",
    "profile.account": "Minha conta",
    "profile.title": "Perfil",
    "profile.subtitle": "Gerencie sua foto, idioma, fuso horário e senha.",
    "profile.changePhoto": "Alterar foto",
    "profile.removePhoto": "Remover foto",
    "profile.photoHint": "JPG, PNG ou WebP. Tamanho máximo de 2 MB.",
    "profile.preferences": "Preferências regionais",
    "profile.preferencesHint":
      "Aplicadas aos status, enums, datas e próximas telas.",
    "profile.language": "Idioma",
    "profile.timeZone": "Fuso horário",
    "profile.savePreferences": "Salvar preferências",
    "profile.preferencesSaved": "Preferências atualizadas.",
    "profile.photoUpdated": "Foto atualizada.",
    "profile.photoRemoved": "Foto removida.",
    "profile.changePassword": "Alterar senha",
    "profile.passwordHint":
      "Use pelo menos 8 caracteres e uma senha diferente da atual.",
    "profile.currentPassword": "Senha atual",
    "profile.newPassword": "Nova senha",
    "profile.confirmPassword": "Confirmar nova senha",
    "profile.passwordChanged": "Senha alterada com sucesso.",
    "profile.invalidPhoto": "Selecione uma imagem JPG, PNG ou WebP.",
    "profile.photoTooLarge": "A imagem deve ter no máximo 2 MB.",
    "profile.passwordTooShort": "A nova senha deve conter pelo menos 8 caracteres.",
    "profile.passwordMismatch": "A confirmação da senha não confere."
  },
  "en-US": {
    "common.active": "Active",
    "common.inactive": "Inactive",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.saving": "Saving...",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.search": "Search",
    "common.refresh": "Refresh",
    "common.back": "Back",
    "common.close": "Close",
    "common.add": "Add",
    "common.remove": "Remove",
    "common.required": "Required",
    "common.optional": "Optional",
    "common.copy": "Copy",
    "common.copied": "Copied",
    "common.yes": "Yes",
    "common.no": "No",
    "common.noDeadline": "No deadline",
    "common.notProvided": "Not provided",
    "nav.dashboard": "Overview",
    "nav.myRequests": "My requests",
    "nav.requests": "Requests",
    "nav.clients": "Clients",
    "nav.catalogs": "Catalogs",
    "nav.users": "Users",
    "nav.settings": "Settings",
    "nav.logout": "Sign out",
    "nav.systemOnline": "System online",
    "nav.systemOffline": "System unavailable",
    "auth.secureDocuments": "Secure document management",
    "auth.hero": "Organized documents. Access under control.",
    "auth.description":
      "Centralize requests, track submissions, and review documents in one company workspace.",
    "auth.security": "Role-based permissions and company isolation",
    "auth.title": "Sign in to your account",
    "auth.subtitle": "Use your credentials to continue.",
    "auth.email": "Email",
    "auth.emailPlaceholder": "name@company.com",
    "auth.password": "Password",
    "auth.passwordPlaceholder": "Your password",
    "auth.showPassword": "Show password",
    "auth.hidePassword": "Hide password",
    "auth.forgot": "Forgot my password",
    "auth.recoveryTitle": "Account recovery",
    "auth.recoveryDescription":
      "Contact your company administrator to receive a temporary password.",
    "auth.recoverySecurity":
      "For security, the reset is recorded in the user's audit history.",
    "auth.login": "Sign in",
    "auth.loggingIn": "Signing in...",
    "auth.sessionExpired": "Your session expired. Sign in again to continue.",
    "auth.twoFactor": "This account requires two-factor authentication.",
    "auth.apiUnavailable": "API unavailable",
    "auth.apiHealthy": "API and database {status}",
    "dashboard.hello": "Hello, {name}",
    "dashboard.subtitle": "Track your company's recent work.",
    "dashboard.newRequest": "New request",
    "dashboard.waiting": "Waiting for upload",
    "dashboard.openRequests": "Open requests",
    "dashboard.reviewing": "Under review",
    "dashboard.received": "Documents received",
    "dashboard.approved": "Approved",
    "dashboard.completed": "Completed",
    "dashboard.resubmission": "Resubmission requested",
    "dashboard.attention": "Need attention",
    "dashboard.recent": "Recent requests",
    "dashboard.recentSubtitle": "Latest activity available to your profile.",
    "dashboard.viewAll": "View all",
    "roles.systemAdmin": "System administrator",
    "roles.tenantAdmin": "Company administrator",
    "roles.user": "User",
    "requests.documents": "Documents",
    "requests.mineSubtitle": "Track the requests created by you.",
    "requests.allSubtitle":
      "Track company document submissions and progress.",
    "requests.loading": "Loading requests...",
    "requests.loadError": "Could not load the data",
    "requests.retry": "Try again",
    "requests.searchPlaceholder":
      "Search by client, template, status, or number",
    "requests.statusFilter": "Filter by status",
    "requests.allStatuses": "All statuses",
    "requests.from": "From",
    "requests.to": "To",
    "requests.clearFilters": "Clear",
    "requests.resultCount": "{count} result(s)",
    "requests.none": "No requests found",
    "requests.noResults": "No results found",
    "requests.noResultsHint": "Adjust the search terms to find another request.",
    "requests.emptyHint": "Create the first request to start the document flow.",
    "requests.create": "Create request",
    "requests.request": "Request",
    "requests.client": "Client",
    "requests.status": "Status",
    "requests.createdAt": "Created at",
    "requests.submittedAt": "Submitted at",
    "requests.open": "Open request {id}",
    "profile.account": "My account",
    "profile.title": "Profile",
    "profile.subtitle": "Manage your photo, language, time zone, and password.",
    "profile.changePhoto": "Change photo",
    "profile.removePhoto": "Remove photo",
    "profile.photoHint": "JPG, PNG, or WebP. Maximum size 2 MB.",
    "profile.preferences": "Regional preferences",
    "profile.preferencesHint":
      "Applied to statuses, enums, dates, and upcoming screens.",
    "profile.language": "Language",
    "profile.timeZone": "Time zone",
    "profile.savePreferences": "Save preferences",
    "profile.preferencesSaved": "Preferences updated.",
    "profile.photoUpdated": "Photo updated.",
    "profile.photoRemoved": "Photo removed.",
    "profile.changePassword": "Change password",
    "profile.passwordHint":
      "Use at least 8 characters and a password different from the current one.",
    "profile.currentPassword": "Current password",
    "profile.newPassword": "New password",
    "profile.confirmPassword": "Confirm new password",
    "profile.passwordChanged": "Password changed successfully.",
    "profile.invalidPhoto": "Select a JPG, PNG, or WebP image.",
    "profile.photoTooLarge": "The image must be no larger than 2 MB.",
    "profile.passwordTooShort": "The new password must contain at least 8 characters.",
    "profile.passwordMismatch": "The password confirmation does not match."
  }
} as const;

export type MessageKey = keyof (typeof messages)["pt-BR"];

interface I18nValue {
  locale: SupportedLocale;
  setLocale: (locale: string) => void;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
  formatDateTime: (value: string | Date) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() =>
    normalizeLocale(navigator.language)
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => setLocaleState(normalizeLocale(nextLocale)),
      t: (key, values) => interpolate(messages[locale][key], values),
      formatDateTime: (value) =>
        new Intl.DateTimeFormat(locale, {
          dateStyle: "short",
          timeStyle: "short"
        }).format(new Date(value))
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider.");
  return context;
}

function normalizeLocale(locale: string): SupportedLocale {
  return locale.toLocaleLowerCase().startsWith("en") ? "en-US" : "pt-BR";
}

function interpolate(
  message: string,
  values?: Record<string, string | number>
) {
  if (!values) return message;
  return message.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(values[key] ?? "")
  );
}
