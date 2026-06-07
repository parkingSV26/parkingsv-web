"use client";

import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  applyPreferencesToDocument,
  arePreferencesEqual,
  persistPreferences,
  settingsDictionaries,
  type ParkingPreferences,
} from "@/app/settings/_lib/preferences";
import styles from "./settings.module.css";

type SettingsClientProps = {
  initialPreferences: ParkingPreferences;
  userId: number;
};

export default function SettingsClient({ initialPreferences, userId }: SettingsClientProps) {
  const [savedPreferences, setSavedPreferences] = useState<ParkingPreferences>(initialPreferences);
  const [draftPreferences, setDraftPreferences] = useState<ParkingPreferences>(initialPreferences);
  const [feedback, setFeedback] = useState<null | { message: string; type: "error" | "success" }>(
    null,
  );

  const dictionary = settingsDictionaries[draftPreferences.language];
  const hasUnsavedChanges = !arePreferencesEqual(savedPreferences, draftPreferences);

  useEffect(() => {
    applyPreferencesToDocument(draftPreferences);
  }, [draftPreferences]);

  async function handleSave() {
    try {
      const response = await fetch("/api/preferences", {
        body: JSON.stringify(draftPreferences),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as {
        error?: string;
        preferences?: ParkingPreferences;
      };

      if (!response.ok || !payload.preferences) {
        throw new Error(payload.error ?? "No se pudieron guardar las preferencias.");
      }

      persistPreferences(payload.preferences, userId);
      setSavedPreferences(payload.preferences);
      setDraftPreferences(payload.preferences);
      setFeedback({
        type: "success",
        message: dictionary.saved,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : draftPreferences.language === "en"
              ? "Your changes could not be saved."
              : "No se pudieron guardar los cambios.",
      });
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <span className={styles.chip}>{dictionary.preview}</span>
          <h1>{dictionary.title}</h1>
          <p>{dictionary.subtitle}</p>
          <small>{dictionary.accountOnly}</small>
        </section>

        {feedback ? (
          <div
            className={`${styles.message} ${
              feedback.type === "success" ? styles.messageSuccess : styles.messageError
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        {hasUnsavedChanges ? (
          <div className={styles.messageHint}>
            <strong>{dictionary.unsaved}</strong>
            <span>{dictionary.saveHint}</span>
          </div>
        ) : null}

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>{dictionary.appearance}</h2>
              <p>{dictionary.appearanceDesc}</p>
            </div>

            <div className={styles.group}>
              <div className={styles.groupHead}>
                <h3>{dictionary.theme}</h3>
                <p>{dictionary.themeHelp}</p>
              </div>

              <div className={styles.optionsTwo}>
                <ChoiceCard
                  checked={draftPreferences.theme === "light"}
                  icon="fas fa-sun"
                  label={dictionary.light}
                  name="theme"
                  onSelect={() => updateDraftPreferences(setDraftPreferences, { theme: "light" })}
                />
                <ChoiceCard
                  checked={draftPreferences.theme === "dark"}
                  icon="fas fa-moon"
                  label={dictionary.dark}
                  name="theme"
                  onSelect={() => updateDraftPreferences(setDraftPreferences, { theme: "dark" })}
                />
              </div>
            </div>

            <div className={styles.group}>
              <div className={styles.groupHead}>
                <h3>{dictionary.fontSize}</h3>
              </div>

              <div className={styles.optionsThree}>
                <ChoiceCard
                  checked={draftPreferences.fontSize === "small"}
                  icon="fas fa-text-height"
                  label={dictionary.fontSmall}
                  name="font-size"
                  onSelect={() =>
                    updateDraftPreferences(setDraftPreferences, { fontSize: "small" })
                  }
                />
                <ChoiceCard
                  checked={draftPreferences.fontSize === "medium"}
                  icon="fas fa-text-height"
                  label={dictionary.fontMedium}
                  name="font-size"
                  onSelect={() =>
                    updateDraftPreferences(setDraftPreferences, { fontSize: "medium" })
                  }
                />
                <ChoiceCard
                  checked={draftPreferences.fontSize === "large"}
                  icon="fas fa-text-height"
                  label={dictionary.fontLarge}
                  name="font-size"
                  onSelect={() =>
                    updateDraftPreferences(setDraftPreferences, { fontSize: "large" })
                  }
                />
              </div>
            </div>

            <div className={styles.group}>
              <div className={styles.groupHead}>
                <h3>{dictionary.language}</h3>
                <p>{dictionary.languageHelp}</p>
              </div>

              <div className={styles.optionsTwo}>
                <ChoiceCard
                  checked={draftPreferences.language === "es"}
                  customPrefix={<span className={styles.flag}>ES</span>}
                  label={dictionary.languageEs}
                  name="language"
                  onSelect={() => updateDraftPreferences(setDraftPreferences, { language: "es" })}
                />
                <ChoiceCard
                  checked={draftPreferences.language === "en"}
                  customPrefix={<span className={styles.flag}>EN</span>}
                  label={dictionary.languageEn}
                  name="language"
                  onSelect={() => updateDraftPreferences(setDraftPreferences, { language: "en" })}
                />
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>{dictionary.preferences}</h2>
              <p>{dictionary.preferencesDesc}</p>
            </div>

            <div className={styles.switches}>
              <ToggleRow
                checked={draftPreferences.location}
                description={dictionary.locationHelp}
                label={dictionary.location}
                onChange={(checked) =>
                  updateDraftPreferences(setDraftPreferences, { location: checked })
                }
              />
              <ToggleRow
                checked={draftPreferences.recommendations}
                description={dictionary.recommendationsHelp}
                label={dictionary.recommendations}
                onChange={(checked) =>
                  updateDraftPreferences(setDraftPreferences, { recommendations: checked })
                }
              />
              <ToggleRow
                checked={draftPreferences.notifications}
                description={dictionary.notificationsHelp}
                label={dictionary.notifications}
                onChange={(checked) =>
                  updateDraftPreferences(setDraftPreferences, { notifications: checked })
                }
              />
            </div>
          </section>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.saveButton}
            disabled={!hasUnsavedChanges}
            onClick={() => void handleSave()}
          >
            <i className="fas fa-save" aria-hidden="true" />
            <span>{dictionary.save}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

type ChoiceCardProps = {
  checked: boolean;
  customPrefix?: ReactNode;
  icon?: string;
  label: string;
  name: string;
  onSelect: () => void;
};

function ChoiceCard({ checked, customPrefix, icon, label, name, onSelect }: ChoiceCardProps) {
  return (
    <label className={styles.option}>
      <input checked={checked} name={name} type="radio" onChange={onSelect} />
      <span className={styles.optionBody}>
        {customPrefix ?? (icon ? <i className={icon} aria-hidden="true" /> : null)}
        <span>{label}</span>
      </span>
    </label>
  );
}

type ToggleRowProps = {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
};

function ToggleRow({ checked, description, label, onChange }: ToggleRowProps) {
  return (
    <label className={styles.switchRow}>
      <span className={styles.switchCopy}>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>

      <span className={styles.switch}>
        <input checked={checked} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
        <span className={styles.slider} />
      </span>
    </label>
  );
}

function updateDraftPreferences(
  setDraftPreferences: Dispatch<SetStateAction<ParkingPreferences>>,
  updates: Partial<ParkingPreferences>,
) {
  setDraftPreferences((currentPreferences) => ({
    ...currentPreferences,
    ...updates,
  }));
}
