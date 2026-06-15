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
import {
  MessageKey,
  useI18n
} from "../../i18n/I18nContext";
import { APPLICATION_ROLES } from "../../app/accessControl";

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
  const { setLocale, t } = useI18n();
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
      setLocale(updated.preferredCulture);
      onUserUpdated(updated);
      setMessage(t("profile.preferencesSaved"));
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
      setError(t("profile.invalidPhoto"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(t("profile.photoTooLarge"));
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
      setMessage(t("profile.photoUpdated"));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function removeAvatar() {
    if (!window.confirm(`${t("profile.removePhoto")}?`)) return;

    setUploadingAvatar(true);
    setError("");
    try {
      await removeCurrentUserAvatar(token);
      setAvatarUrl(null);
      onAvatarChanged();
      setMessage(t("profile.photoRemoved"));
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
          <span className="eyebrow">{t("profile.account")}</span>
          <h1>{t("profile.title")}</h1>
          <p>{t("profile.subtitle")}</p>
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
          <small>{getRoleLabel(user.roles, t)}</small>

          <div className="profile-avatar-actions">
            <label className="secondary-button">
              {uploadingAvatar ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Camera size={16} />
              )}
              {t("profile.changePhoto")}
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
                title={t("profile.removePhoto")}
              >
                <Trash2 size={17} />
              </button>
            )}
          </div>
          <p>{t("profile.photoHint")}</p>
        </section>

        <div className="profile-content">
          <form className="profile-card profile-form" onSubmit={savePreferences}>
            <div className="profile-section-heading">
              <div>
                <h2>{t("profile.preferences")}</h2>
                <p>{t("profile.preferencesHint")}</p>
              </div>
            </div>
            <div className="form-grid">
              <div>
                <label htmlFor="profile-culture">{t("profile.language")}</label>
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
                <label htmlFor="profile-time-zone">{t("profile.timeZone")}</label>
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
                {savingPreferences
                  ? t("common.saving")
                  : t("profile.savePreferences")}
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
  const { t } = useI18n();
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
      setError(t("profile.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("profile.passwordMismatch"));
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
      setMessage(t("profile.passwordChanged"));
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
          <h2>{t("profile.changePassword")}</h2>
          <p>{t("profile.passwordHint")}</p>
        </div>
      </div>
      <div className="password-fields">
        <div>
          <label htmlFor="current-password">{t("profile.currentPassword")}</label>
          <input
            autoComplete="current-password"
            id="current-password"
            onChange={(event) => setCurrentPassword(event.target.value)}
            type="password"
            value={currentPassword}
          />
        </div>
        <div>
          <label htmlFor="new-password">{t("profile.newPassword")}</label>
          <input
            autoComplete="new-password"
            id="new-password"
            onChange={(event) => setNewPassword(event.target.value)}
            type="password"
            value={newPassword}
          />
        </div>
        <div>
          <label htmlFor="confirm-password">{t("profile.confirmPassword")}</label>
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
          {saving ? t("common.saving") : t("profile.changePassword")}
        </button>
      </div>
    </form>
  );
}

function getRoleLabel(
  roles: string[],
  t: (key: MessageKey) => string
) {
  if (roles.includes(APPLICATION_ROLES.systemAdmin)) return t("roles.systemAdmin");
  if (roles.includes(APPLICATION_ROLES.tenantAdmin)) return t("roles.tenantAdmin");
  return t("roles.user");
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Nao foi possivel concluir a operacao.";
}
