"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Wheat,
} from "lucide-react";

import {
  setFeedFormulaActive,
  setFeedIngredientActive,
} from "@/features/feed/actions/feed";
import type {
  FeedFormulaView,
  FeedIngredientView,
  FeedPageData,
  FeedTab,
  FeedUsageData,
} from "@/features/feed/types/feed";
import { Button } from "@/components/ui/button";

import { FeedFormulaList } from "./feed-formula-list";
import { FeedIngredientList } from "./feed-ingredient-list";
import { FeedUsagePanel } from "./feed-usage-panel";
import { FormulaFormDialog } from "./formula-form-dialog";
import { IngredientFormDialog } from "./ingredient-form-dialog";

type FeedManagementProps = {
  data: FeedPageData;
  usage: FeedUsageData;
  initialTab: FeedTab;
};

export function FeedManagement({
  data,
  usage,
  initialTab,
}: FeedManagementProps) {
  const router = useRouter();

  const [tab, setTab] =
    useState<FeedTab>(
      initialTab,
    );

  const [
    ingredientDialog,
    setIngredientDialog,
  ] = useState<
    FeedIngredientView | "create" | null
  >(null);

  const [
    formulaDialog,
    setFormulaDialog,
  ] = useState<
    FeedFormulaView | "create" | null
  >(null);

  const [actionError, setActionError] =
    useState("");

  const [pendingId, setPendingId] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  function toggleIngredient(
    ingredient: FeedIngredientView,
  ) {
    setActionError("");
    setPendingId(
      ingredient.id,
    );

    startTransition(async () => {
      const result =
        await setFeedIngredientActive(
          ingredient.id,
          !ingredient.isActive,
        );

      setPendingId(null);

      if (!result.success) {
        setActionError(
          result.error,
        );
        return;
      }

      router.refresh();
    });
  }

  function toggleFormula(
    formula: FeedFormulaView,
  ) {
    setActionError("");
    setPendingId(formula.id);

    startTransition(async () => {
      const result =
        await setFeedFormulaActive(
          formula.id,
          !formula.isActive,
        );

      setPendingId(null);

      if (!result.success) {
        setActionError(
          result.error,
        );
        return;
      }

      router.refresh();
    });
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Wheat className="h-5 w-5 text-primary-hover" />

              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Pakan
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted">
              Pemakaian pakan, formula,
              dan master bahan pakan.
            </p>
          </div>

          {tab !== "usage" ? (
            <Button
              className="w-full sm:w-auto"
              onClick={() =>
                tab === "formula"
                  ? setFormulaDialog(
                      "create",
                    )
                  : setIngredientDialog(
                      "create",
                    )
              }
            >
              <Plus className="h-4 w-4" />

              {tab === "formula"
                ? "Tambah Formula"
                : "Tambah Bahan"}
            </Button>
          ) : null}
        </div>

        {actionError ? (
          <div
            role="alert"
            className="rounded-[10px] border border-[#FECACA] bg-danger-soft p-3 text-sm text-danger"
          >
            {actionError}
          </div>
        ) : null}

        <div className="flex overflow-x-auto border-b border-border">
          <button
            type="button"
            onClick={() =>
              setTab("usage")
            }
            className={[
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === "usage"
                ? "border-primary text-primary-hover"
                : "border-transparent text-muted hover:text-foreground",
            ].join(" ")}
          >
            Pemakaian
          </button>

          <button
            type="button"
            onClick={() =>
              setTab("formula")
            }
            className={[
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === "formula"
                ? "border-primary text-primary-hover"
                : "border-transparent text-muted hover:text-foreground",
            ].join(" ")}
          >
            Formula Pakan
          </button>

          <button
            type="button"
            onClick={() =>
              setTab("ingredient")
            }
            className={[
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === "ingredient"
                ? "border-primary text-primary-hover"
                : "border-transparent text-muted hover:text-foreground",
            ].join(" ")}
          >
            Bahan Pakan
          </button>
        </div>

        {tab === "usage" ? (
          <FeedUsagePanel
            data={usage}
          />
        ) : tab === "formula" ? (
          <FeedFormulaList
            formulas={data.formulas}
            pendingId={
              isPending
                ? pendingId
                : null
            }
            onEdit={
              setFormulaDialog
            }
            onToggle={
              toggleFormula
            }
          />
        ) : (
          <FeedIngredientList
            ingredients={
              data.ingredients
            }
            pendingId={
              isPending
                ? pendingId
                : null
            }
            onEdit={
              setIngredientDialog
            }
            onToggle={
              toggleIngredient
            }
          />
        )}
      </div>

      {ingredientDialog ? (
        <IngredientFormDialog
          ingredient={
            ingredientDialog ===
            "create"
              ? undefined
              : ingredientDialog
          }
          onClose={() =>
            setIngredientDialog(
              null,
            )
          }
        />
      ) : null}

      {formulaDialog ? (
        <FormulaFormDialog
          formula={
            formulaDialog ===
            "create"
              ? undefined
              : formulaDialog
          }
          ingredients={
            data.ingredients
          }
          onClose={() =>
            setFormulaDialog(null)
          }
        />
      ) : null}
    </>
  );
}