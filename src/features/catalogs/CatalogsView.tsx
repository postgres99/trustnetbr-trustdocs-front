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
  reorderTemplateRequirements,
  removeTemplateRequirement,
  RequestTemplate,
  updateRequestTemplate,
  updateTemplateRequirement
} from "../../services/api/requestTemplates";
import { useI18n } from "../../i18n/I18nContext";

type CatalogTab = "types" | "templates";

export function CatalogsView({ token }: { token: string }) {
  const { locale } = useI18n();
  const c = locale === "en-US" ? catalogsCopy.en : catalogsCopy.pt;
  const [tab, setTab] = useState<CatalogTab>("types");

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{c.documentStructure}</span>
          <h1>{c.title}</h1>
          <p>{c.subtitle}</p>
        </div>
      </div>
      <div className="settings-tabs">
        <button
          className={tab === "types" ? "active" : ""}
          onClick={() => setTab("types")}
        >
          <FileText size={17} />
          {c.documentTypes}
        </button>
        <button
          className={tab === "templates" ? "active" : ""}
          onClick={() => setTab("templates")}
        >
          <FileCheck2 size={17} />
          {c.templates}
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
  const { locale } = useI18n();
  const c = locale === "en-US" ? catalogsCopy.en : catalogsCopy.pt;
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
            <h2>{c.documentTypes}</h2>
            <p>{c.typesDescription}</p>
          </div>
          <button
            className="primary-button compact-button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={17} />
            {c.newType}
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
                <p>{type.description || c.noDescription}</p>
              </div>
              <span className={`status-badge ${type.isActive ? "success" : "danger"}`}>
                {type.isActive ? c.active : c.inactive}
              </span>
              <button
                className="icon-button"
                onClick={() => {
                  setEditing(type);
                  setFormOpen(true);
                }}
                title={c.edit}
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
  const { locale } = useI18n();
  const c = locale === "en-US" ? catalogsCopy.en : catalogsCopy.pt;
  const [name, setName] = useState(type?.name ?? "");
  const [description, setDescription] = useState(type?.description ?? "");
  const [active, setActive] = useState(type?.isActive ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError(c.typeNameRequired);
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
    <SimpleDialog title={type ? c.editType : c.newType} onClose={onClose}>
      <form className="dialog-form" onSubmit={submit}>
        <div>
          <label>{c.name}</label>
          <input
            autoFocus
            maxLength={150}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
        </div>
        <div>
          <label>{c.description}</label>
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
          {c.activeType}
        </label>
        {error && <div className="form-error">{error}</div>}
        <DialogActions saving={saving} onClose={onClose} />
      </form>
    </SimpleDialog>
  );
}

function TemplatesPanel({ token }: { token: string }) {
  const { locale } = useI18n();
  const c = locale === "en-US" ? catalogsCopy.en : catalogsCopy.pt;
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
            <h2>{c.requestTemplates}</h2>
            <p>{c.templatesDescription}</p>
          </div>
          <button
            className="primary-button compact-button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={17} />
            {c.newTemplate}
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
                  {template.requirements.length} {c.documents} ·{" "}
                  {template.requirements.filter((item) => item.isRequired).length} {c.requiredPlural}
                </span>
              </div>
              <span className={`status-badge ${template.isActive ? "success" : "danger"}`}>
                {template.isActive ? c.active : c.inactive}
              </span>
              <button
                className="secondary-button compact-secondary"
                onClick={() => {
                  setEditing(template);
                  setFormOpen(true);
                }}
              >
                {c.configure}
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
  const { locale } = useI18n();
  const c = locale === "en-US" ? catalogsCopy.en : catalogsCopy.pt;
  const [current, setCurrent] = useState(template);
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [active, setActive] = useState(template?.isActive ?? false);
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
      setError(c.templateNameRequired);
      return;
    }
    if (active && !current?.requirements.length) {
      setError(c.requirementRequiredForActivation);
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
    if (!current || !window.confirm(c.removeDocumentConfirm)) return;
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

    const reordered = [...requirements];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index]
    ];

    try {
      const updated = await reorderTemplateRequirements(
        token,
        current.id,
        reordered.map((requirement) => requirement.requirementId)
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
      title={current ? c.configureTemplate : c.newTemplate}
      onClose={onClose}
    >
      <form className="dialog-form template-form" onSubmit={saveBasics}>
        <div className="form-grid">
          <div className="full-field">
            <label>{c.name}</label>
            <input
              autoFocus
              maxLength={150}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </div>
          <div className="full-field">
            <label>{c.description}</label>
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
            onChange={(event) => {
              setActive(event.target.checked);
              setError("");
            }}
            type="checkbox"
          />
          {c.activeTemplate}
        </label>
        <button className="secondary-button save-basics" disabled={saving}>
          {saving ? c.saving : current ? c.saveTemplateData : c.createTemplate}
        </button>

        {current && (
          <section className="requirements-editor">
            <div>
              <h3>{c.requestedDocuments}</h3>
              <p>{c.requirementsDescription}</p>
            </div>
            <div className="add-requirement">
              <select
                onChange={(event) => setNewTypeId(event.target.value)}
                value={newTypeId}
              >
                <option value="">{c.selectType}</option>
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
                {c.required}
              </label>
              <button
                className="secondary-button"
                disabled={!newTypeId}
                onClick={() => void addRequirement()}
                type="button"
              >
                <Plus size={16} />
                {c.add}
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
                    {c.required}
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
            {c.finish}
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
  const { locale } = useI18n();
  const c = locale === "en-US" ? catalogsCopy.en : catalogsCopy.pt;
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className={`side-dialog ${wide ? "catalog-dialog" : ""}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="dialog-header">
          <div>
            <span className="eyebrow">{c.catalog}</span>
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
  const { locale } = useI18n();
  const c = locale === "en-US" ? catalogsCopy.en : catalogsCopy.pt;
  return (
    <footer className="dialog-actions">
      <button className="secondary-button" onClick={onClose} type="button">
        {c.cancel}
      </button>
      <button className="primary-button compact-button" disabled={saving}>
        {saving ? c.saving : c.save}
      </button>
    </footer>
  );
}

function getMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Nao foi possivel concluir a operacao.";
}

const catalogsCopy = {
  pt: {
    documentStructure: "Estrutura documental",
    title: "Catálogos",
    subtitle: "Defina os documentos aceitos e os modelos de solicitação.",
    documentTypes: "Tipos de documento",
    templates: "Modelos",
    typesDescription: "Cadastros reutilizados pelos modelos.",
    newType: "Novo tipo",
    noDescription: "Sem descrição",
    active: "Ativo",
    inactive: "Inativo",
    edit: "Editar",
    typeNameRequired: "Informe o nome do tipo de documento.",
    editType: "Editar tipo",
    name: "Nome",
    description: "Descrição",
    activeType: "Tipo ativo",
    requestTemplates: "Modelos de solicitação",
    templatesDescription: "Conjuntos ordenados de documentos enviados ao cliente.",
    newTemplate: "Novo modelo",
    documents: "documento(s)",
    requiredPlural: "obrigatório(s)",
    configure: "Configurar",
    templateNameRequired: "Informe o nome do modelo.",
    requirementRequiredForActivation:
      "Adicione pelo menos um documento antes de ativar o modelo.",
    removeDocumentConfirm: "Remover este documento do modelo?",
    configureTemplate: "Configurar modelo",
    activeTemplate: "Modelo ativo",
    saving: "Salvando...",
    saveTemplateData: "Salvar dados do modelo",
    createTemplate: "Criar modelo",
    requestedDocuments: "Documentos solicitados",
    requirementsDescription: "Defina obrigatoriedade e ordem de exibição.",
    selectType: "Selecione um tipo",
    required: "Obrigatório",
    add: "Adicionar",
    finish: "Concluir",
    catalog: "Catálogo",
    cancel: "Cancelar",
    save: "Salvar"
  },
  en: {
    documentStructure: "Document structure",
    title: "Catalogs",
    subtitle: "Define accepted documents and request templates.",
    documentTypes: "Document types",
    templates: "Templates",
    typesDescription: "Reusable records used by templates.",
    newType: "New type",
    noDescription: "No description",
    active: "Active",
    inactive: "Inactive",
    edit: "Edit",
    typeNameRequired: "Enter the document type name.",
    editType: "Edit type",
    name: "Name",
    description: "Description",
    activeType: "Active type",
    requestTemplates: "Request templates",
    templatesDescription: "Ordered document sets sent to the client.",
    newTemplate: "New template",
    documents: "document(s)",
    requiredPlural: "required",
    configure: "Configure",
    templateNameRequired: "Enter the template name.",
    requirementRequiredForActivation:
      "Add at least one document before activating the template.",
    removeDocumentConfirm: "Remove this document from the template?",
    configureTemplate: "Configure template",
    activeTemplate: "Active template",
    saving: "Saving...",
    saveTemplateData: "Save template details",
    createTemplate: "Create template",
    requestedDocuments: "Requested documents",
    requirementsDescription: "Define requirement and display order.",
    selectType: "Select a type",
    required: "Required",
    add: "Add",
    finish: "Finish",
    catalog: "Catalog",
    cancel: "Cancel",
    save: "Save"
  }
};
