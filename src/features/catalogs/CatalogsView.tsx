import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  ArrowDown,
  ArrowUp,
  FileCheck2,
  FileText,
  Pencil,
  Plus,
  Trash2,
  X
} from "lucide-react";
import { ApiError } from "../../services/api/client";
import {
  createDocumentType,
  DocumentType,
  getDocumentTypes,
  updateDocumentType
} from "../../services/api/documentTypes";
import {
  addTemplateRequirement,
  createRequestTemplate,
  getRequestTemplates,
  removeTemplateRequirement,
  RequestTemplate,
  updateRequestTemplate,
  updateTemplateRequirement
} from "../../services/api/requestTemplates";

type CatalogTab = "types" | "templates";

export function CatalogsView({ token }: { token: string }) {
  const [tab, setTab] = useState<CatalogTab>("types");

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Estrutura documental</span>
          <h1>Catalogos</h1>
          <p>Defina os documentos aceitos e os modelos de solicitacao.</p>
        </div>
      </div>
      <div className="settings-tabs">
        <button
          className={tab === "types" ? "active" : ""}
          onClick={() => setTab("types")}
        >
          <FileText size={17} />
          Tipos de documento
        </button>
        <button
          className={tab === "templates" ? "active" : ""}
          onClick={() => setTab("templates")}
        >
          <FileCheck2 size={17} />
          Modelos
        </button>
      </div>
      {tab === "types" ? (
        <DocumentTypesPanel token={token} />
      ) : (
        <TemplatesPanel token={token} />
      )}
    </>
  );
}

function DocumentTypesPanel({ token }: { token: string }) {
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [editing, setEditing] = useState<DocumentType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDocumentTypes(token).then(setTypes).catch((error) => setError(getMessage(error)));
  }, [token]);

  function saved(type: DocumentType) {
    setTypes((current) => {
      const exists = current.some((item) => item.id === type.id);
      return (exists
        ? current.map((item) => (item.id === type.id ? type : item))
        : [...current, type]
      ).sort((a, b) => a.name.localeCompare(b.name));
    });
    setFormOpen(false);
    setEditing(null);
  }

  return (
    <>
      {error && <div className="form-error profile-feedback">{error}</div>}
      <section className="dashboard-section requests-section">
        <div className="section-heading">
          <div>
            <h2>Tipos de documento</h2>
            <p>Cadastros reutilizados pelos modelos.</p>
          </div>
          <button
            className="primary-button compact-button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={17} />
            Novo tipo
          </button>
        </div>
        <div className="catalog-grid">
          {types.map((type) => (
            <article className="catalog-card" key={type.id}>
              <span className="catalog-icon">
                <FileText size={20} />
              </span>
              <div>
                <strong>{type.name}</strong>
                <p>{type.description || "Sem descricao"}</p>
              </div>
              <span className={`status-badge ${type.isActive ? "success" : "danger"}`}>
                {type.isActive ? "Ativo" : "Inativo"}
              </span>
              <button
                className="icon-button"
                onClick={() => {
                  setEditing(type);
                  setFormOpen(true);
                }}
                title="Editar"
              >
                <Pencil size={17} />
              </button>
            </article>
          ))}
        </div>
      </section>
      {formOpen && (
        <DocumentTypeForm
          token={token}
          type={editing}
          onClose={() => setFormOpen(false)}
          onSaved={saved}
        />
      )}
    </>
  );
}

function DocumentTypeForm({
  token,
  type,
  onClose,
  onSaved
}: {
  token: string;
  type: DocumentType | null;
  onClose: () => void;
  onSaved: (type: DocumentType) => void;
}) {
  const [name, setName] = useState(type?.name ?? "");
  const [description, setDescription] = useState(type?.description ?? "");
  const [active, setActive] = useState(type?.isActive ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Informe o nome do tipo de documento.");
      return;
    }
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        description: description.trim() || null,
        isActive: active
      };
      onSaved(
        type
          ? await updateDocumentType(token, type.id, input)
          : await createDocumentType(token, input)
      );
    } catch (requestError) {
      setError(getMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SimpleDialog title={type ? "Editar tipo" : "Novo tipo"} onClose={onClose}>
      <form className="dialog-form" onSubmit={submit}>
        <div>
          <label>Nome</label>
          <input
            autoFocus
            maxLength={150}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </div>
        <div>
          <label>Descricao</label>
          <textarea
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            value={description}
          />
        </div>
        <label className="toggle-field">
          <input
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            type="checkbox"
          />
          Tipo ativo
        </label>
        {error && <div className="form-error">{error}</div>}
        <DialogActions saving={saving} onClose={onClose} />
      </form>
    </SimpleDialog>
  );
}

function TemplatesPanel({ token }: { token: string }) {
  const [templates, setTemplates] = useState<RequestTemplate[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [editing, setEditing] = useState<RequestTemplate | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getRequestTemplates(token), getDocumentTypes(token)])
      .then(([templateData, typeData]) => {
        setTemplates(templateData);
        setDocumentTypes(typeData.filter((type) => type.isActive));
      })
      .catch((error) => setError(getMessage(error)));
  }, [token]);

  function saved(template: RequestTemplate) {
    setTemplates((current) => {
      const exists = current.some((item) => item.id === template.id);
      return (exists
        ? current.map((item) => (item.id === template.id ? template : item))
        : [...current, template]
      ).sort((a, b) => a.name.localeCompare(b.name));
    });
    setEditing(template);
  }

  return (
    <>
      {error && <div className="form-error profile-feedback">{error}</div>}
      <section className="dashboard-section requests-section">
        <div className="section-heading">
          <div>
            <h2>Modelos de solicitacao</h2>
            <p>Conjuntos ordenados de documentos enviados ao cliente.</p>
          </div>
          <button
            className="primary-button compact-button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={17} />
            Novo modelo
          </button>
        </div>
        <div className="template-list">
          {templates.map((template) => (
            <article className="template-row" key={template.id}>
              <span className="catalog-icon">
                <FileCheck2 size={20} />
              </span>
              <div>
                <strong>{template.name}</strong>
                <span>
                  {template.requirements.length} documento(s) ·{" "}
                  {template.requirements.filter((item) => item.isRequired).length} obrigatorio(s)
                </span>
              </div>
              <span className={`status-badge ${template.isActive ? "success" : "danger"}`}>
                {template.isActive ? "Ativo" : "Inativo"}
              </span>
              <button
                className="secondary-button compact-secondary"
                onClick={() => {
                  setEditing(template);
                  setFormOpen(true);
                }}
              >
                Configurar
              </button>
            </article>
          ))}
        </div>
      </section>
      {formOpen && (
        <TemplateForm
          documentTypes={documentTypes}
          template={editing}
          token={token}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={saved}
        />
      )}
    </>
  );
}

function TemplateForm({
  token,
  template,
  documentTypes,
  onClose,
  onSaved
}: {
  token: string;
  template: RequestTemplate | null;
  documentTypes: DocumentType[];
  onClose: () => void;
  onSaved: (template: RequestTemplate) => void;
}) {
  const [current, setCurrent] = useState(template);
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [active, setActive] = useState(template?.isActive ?? true);
  const [newTypeId, setNewTypeId] = useState("");
  const [newRequired, setNewRequired] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const availableTypes = useMemo(
    () =>
      documentTypes.filter(
        (type) =>
          !current?.requirements.some(
            (requirement) => requirement.documentTypeId === type.id
          )
      ),
    [current, documentTypes]
  );

  async function saveBasics(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Informe o nome do modelo.");
      return;
    }
    setSaving(true);
    try {
      const input = {
        name: name.trim(),
        description: description.trim() || null,
        isActive: active
      };
      const saved = current
        ? await updateRequestTemplate(token, current.id, input)
        : await createRequestTemplate(token, input);
      setCurrent(saved);
      onSaved(saved);
    } catch (requestError) {
      setError(getMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function addRequirement() {
    if (!current || !newTypeId) return;
    try {
      const updated = await addTemplateRequirement(
        token,
        current.id,
        Number(newTypeId),
        newRequired
      );
      setCurrent(updated);
      onSaved(updated);
      setNewTypeId("");
    } catch (requestError) {
      setError(getMessage(requestError));
    }
  }

  async function updateRequirement(
    requirementId: number,
    required: boolean,
    order: number
  ) {
    if (!current) return;
    try {
      const updated = await updateTemplateRequirement(
        token,
        current.id,
        requirementId,
        required,
        order
      );
      setCurrent(updated);
      onSaved(updated);
    } catch (requestError) {
      setError(getMessage(requestError));
    }
  }

  async function removeRequirement(requirementId: number) {
    if (!current || !window.confirm("Remover este documento do modelo?")) return;
    try {
      const updated = await removeTemplateRequirement(
        token,
        current.id,
        requirementId
      );
      setCurrent(updated);
      onSaved(updated);
    } catch (requestError) {
      setError(getMessage(requestError));
    }
  }

  async function moveRequirement(index: number, direction: -1 | 1) {
    if (!current) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= requirements.length) return;

    const moving = requirements[index];
    const target = requirements[targetIndex];

    try {
      await updateTemplateRequirement(
        token,
        current.id,
        moving.requirementId,
        moving.isRequired,
        target.order
      );
      const updated = await updateTemplateRequirement(
        token,
        current.id,
        target.requirementId,
        target.isRequired,
        moving.order
      );
      setCurrent(updated);
      onSaved(updated);
    } catch (requestError) {
      setError(getMessage(requestError));
    }
  }

  const requirements = current?.requirements
    .slice()
    .sort((a, b) => a.order - b.order) ?? [];

  return (
    <SimpleDialog
      wide
      title={current ? "Configurar modelo" : "Novo modelo"}
      onClose={onClose}
    >
      <form className="dialog-form template-form" onSubmit={saveBasics}>
        <div className="form-grid">
          <div className="full-field">
            <label>Nome</label>
            <input
              autoFocus
              maxLength={150}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </div>
          <div className="full-field">
            <label>Descricao</label>
            <textarea
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              value={description}
            />
          </div>
        </div>
        <label className="toggle-field">
          <input
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            type="checkbox"
          />
          Modelo ativo
        </label>
        <button className="secondary-button save-basics" disabled={saving}>
          {saving ? "Salvando..." : current ? "Salvar dados do modelo" : "Criar modelo"}
        </button>

        {current && (
          <section className="requirements-editor">
            <div>
              <h3>Documentos solicitados</h3>
              <p>Defina obrigatoriedade e ordem de exibicao.</p>
            </div>
            <div className="add-requirement">
              <select
                onChange={(event) => setNewTypeId(event.target.value)}
                value={newTypeId}
              >
                <option value="">Selecione um tipo</option>
                {availableTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <label className="toggle-field">
                <input
                  checked={newRequired}
                  onChange={(event) => setNewRequired(event.target.checked)}
                  type="checkbox"
                />
                Obrigatorio
              </label>
              <button
                className="secondary-button"
                disabled={!newTypeId}
                onClick={() => void addRequirement()}
                type="button"
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>
            <div className="requirement-editor-list">
              {requirements.map((requirement, index) => (
                <article key={requirement.requirementId}>
                  <span>{index + 1}</span>
                  <strong>{requirement.documentTypeName}</strong>
                  <label className="toggle-field">
                    <input
                      checked={requirement.isRequired}
                      onChange={(event) =>
                        void updateRequirement(
                          requirement.requirementId,
                          event.target.checked,
                          requirement.order
                        )
                      }
                      type="checkbox"
                    />
                    Obrigatorio
                  </label>
                  <div className="requirement-actions">
                    <button
                      className="icon-button"
                      disabled={index === 0}
                      onClick={() => void moveRequirement(index, -1)}
                      type="button"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      className="icon-button"
                      disabled={index === requirements.length - 1}
                      onClick={() => void moveRequirement(index, 1)}
                      type="button"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      className="icon-button danger-button"
                      onClick={() => void removeRequirement(requirement.requirementId)}
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {error && <div className="form-error">{error}</div>}
        <footer className="dialog-actions">
          <button className="primary-button compact-button" onClick={onClose} type="button">
            Concluir
          </button>
        </footer>
      </form>
    </SimpleDialog>
  );
}

function SimpleDialog({
  title,
  wide = false,
  onClose,
  children
}: {
  title: string;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className={`side-dialog ${wide ? "catalog-dialog" : ""}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="dialog-header">
          <div>
            <span className="eyebrow">Catalogo</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function DialogActions({
  saving,
  onClose
}: {
  saving: boolean;
  onClose: () => void;
}) {
  return (
    <footer className="dialog-actions">
      <button className="secondary-button" onClick={onClose} type="button">
        Cancelar
      </button>
      <button className="primary-button compact-button" disabled={saving}>
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </footer>
  );
}

function getMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Nao foi possivel concluir a operacao.";
}
