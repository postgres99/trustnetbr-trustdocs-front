import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  Camera,
  Check,
  KeyRound,
  LoaderCircle,
  Save,
  Trash2,
  UserRound
} from "lucide-react";
import {
  changeCurrentUserPassword,
  CurrentUser,
  getCurrentUserAvatar,
  removeCurrentUserAvatar,
  updateCurrentUserPreferences,
  uploadCurrentUserAvatar
} from "../../services/api/auth";
import { ApiError, setApiCulture } from "../../services/api/client";
import {
  getSupportedCultures,
  getSupportedTimeZones,
  NamedOption
} from "../../services/api/enums";

interface ProfileViewProps {
  token: string;
  user: CurrentUser;
  onAvatarChanged: () => void;
  onUserUpdated: (user: CurrentUser) => void;
}

export function ProfileView({
  token,
  user,
  onAvatarChanged,
  onUserUpdated
}: ProfileViewProps) {
  const [cultures, setCultures] = useState<NamedOption[]>([]);
  const [timeZones, setTimeZones] = useState<NamedOption[]>([]);
  const [culture, setCulture] = useState(user.preferredCulture);
  const [timeZone, setTimeZone] = useState(user.timeZoneId);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getSupportedCultures(),
      getSupportedTimeZones(),
      getCurrentUserAvatar(token)
    ])
      .then(([cultureOptions, timeZoneOptions, avatar]) => {
        setCultures(cultureOptions);
        setTimeZones(timeZoneOptions);
        if (avatar) setAvatarUrl(URL.createObjectURL(avatar));
      })
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, [token]);

  useEffect(
    () => () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    },
    [avatarUrl]
  );

  async function savePreferences(event: FormEvent) {
    event.preventDefault();
    setSavingPreferences(true);
    setError("");
    setMessage("");

    try {
      setApiCulture(culture);
      const updated = await updateCurrentUserPreferences(token, timeZone, culture);
      onUserUpdated(updated);
      setMessage("Preferencias atualizadas.");
    } catch (requestError) {
      setApiCulture(user.preferredCulture);
      setError(getErrorMessage(requestError));
    } finally {
      setSavingPreferences(false);
    }
  }

  async function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Selecione uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("A imagem deve ter no maximo 2 MB.");
      return;
    }

    setUploadingAvatar(true);
    setError("");
    setMessage("");
    try {
      await uploadCurrentUserAvatar(token, file);
      const avatar = await getCurrentUserAvatar(token);
      setAvatarUrl(avatar ? URL.createObjectURL(avatar) : null);
      onAvatarChanged();
      setMessage("Foto atualizada.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function removeAvatar() {
    if (!window.confirm("Remover sua foto de perfil?")) return;

    setUploadingAvatar(true);
    setError("");
    try {
      await removeCurrentUserAvatar(token);
      setAvatarUrl(null);
      onAvatarChanged();
      setMessage("Foto removida.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Minha conta</span>
          <h1>Perfil</h1>
          <p>Gerencie sua foto, idioma, fuso horario e senha.</p>
        </div>
      </div>

      {error && <div className="form-error profile-feedback">{error}</div>}
      {message && (
        <div className="success-feedback profile-feedback">
          <Check size={17} />
          {message}
        </div>
      )}

      <div className="profile-layout">
        <section className="profile-card profile-identity">
          <div className="profile-avatar">
            {avatarUrl ? (
              <img alt={`Foto de ${user.displayName}`} src={avatarUrl} />
            ) : (
              <UserRound size={46} />
            )}
          </div>
          <strong>{user.displayName}</strong>
          <span>{user.email}</span>
          <small>{getRoleLabel(user.roles)}</small>

          <div className="profile-avatar-actions">
            <label className="secondary-button">
              {uploadingAvatar ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Camera size={16} />
              )}
              Alterar foto
              <input
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingAvatar}
                onChange={(event) => void handleAvatar(event)}
                type="file"
              />
            </label>
            {avatarUrl && (
              <button
                aria-label="Remover foto"
                className="icon-button danger-button"
                disabled={uploadingAvatar}
                onClick={() => void removeAvatar()}
                title="Remover foto"
              >
                <Trash2 size={17} />
              </button>
            )}
          </div>
          <p>JPG, PNG ou WebP. Tamanho maximo de 2 MB.</p>
        </section>

        <div className="profile-content">
          <form className="profile-card profile-form" onSubmit={savePreferences}>
            <div className="profile-section-heading">
              <div>
                <h2>Preferencias regionais</h2>
                <p>Aplicadas aos status, enums, datas e proximas telas.</p>
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label htmlFor="profile-culture">Idioma</label>
                <select
                  id="profile-culture"
                  onChange={(event) => setCulture(event.target.value)}
                  value={culture}
                >
                  {cultures.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.description}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="profile-time-zone">Fuso horario</label>
                <select
                  id="profile-time-zone"
                  onChange={(event) => setTimeZone(event.target.value)}
                  value={timeZone}
                >
                  {timeZones.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="profile-form-actions">
              <button
                className="primary-button compact-button"
                disabled={savingPreferences}
              >
                <Save size={16} />
                {savingPreferences ? "Salvando..." : "Salvar preferencias"}
              </button>
            </div>
          </form>

          <PasswordForm token={token} />
        </div>
      </div>
    </>
  );
}

function PasswordForm({ token }: { token: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("A nova senha deve conter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("A confirmacao da senha nao confere.");
      return;
    }

    setSaving(true);
    try {
      await changeCurrentUserPassword(
        token,
        currentPassword,
        newPassword,
        confirmPassword
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Senha alterada com sucesso.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="profile-card profile-form" onSubmit={handleSubmit}>
      <div className="profile-section-heading">
        <span className="profile-heading-icon">
          <KeyRound size={19} />
        </span>
        <div>
          <h2>Alterar senha</h2>
          <p>Use pelo menos 8 caracteres e uma senha diferente da atual.</p>
        </div>
      </div>
      <div className="password-fields">
        <div>
          <label htmlFor="current-password">Senha atual</label>
          <input
            autoComplete="current-password"
            id="current-password"
            onChange={(event) => setCurrentPassword(event.target.value)}
            type="password"
            value={currentPassword}
          />
        </div>
        <div>
          <label htmlFor="new-password">Nova senha</label>
          <input
            autoComplete="new-password"
            id="new-password"
            onChange={(event) => setNewPassword(event.target.value)}
            type="password"
            value={newPassword}
          />
        </div>
        <div>
          <label htmlFor="confirm-password">Confirmar nova senha</label>
          <input
            autoComplete="new-password"
            id="confirm-password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            type="password"
            value={confirmPassword}
          />
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      {message && <div className="success-feedback">{message}</div>}
      <div className="profile-form-actions">
        <button className="secondary-button" disabled={saving}>
          {saving ? "Alterando..." : "Alterar senha"}
        </button>
      </div>
    </form>
  );
}

function getRoleLabel(roles: string[]) {
  if (roles.includes("SuperAdmin")) return "Administrador do sistema";
  if (roles.includes("Administrator")) return "Administrador da empresa";
  return "Usuario";
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Nao foi possivel concluir a operacao.";
}
