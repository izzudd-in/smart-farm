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

  const [actionSuccess, setActionSuccess] =
    useState("");

  const [pendingId, setPendingId] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  function toggleIngredient(
    ingredient: FeedIngredientView,
  ) {
    setActionError("");
    setActionSuccess("");
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

      setActionSuccess(
        result.message ??
          (ingredient.isActive
            ? "Bahan pakan berhasil dinonaktifkan."
            : "Bahan pakan berhasil diaktifkan."),
      );
      router.refresh();
    });
  }

  function toggleFormula(
    formula: FeedFormulaView,
  ) {
    setActionError("");
    setActionSuccess("");
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

      setActionSuccess(
        result.message ??
          (formula.isActive
            ? "Formula pakan berhasil dinonaktifkan."
            : "Formula pakan berhasil diaktifkan."),
      );
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

        {actionSuccess ? (
          <div
            role="status"
            className="flex items-center justify-between rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] p-3 text-sm text-[#15803D]"
          >
            <span className="font-medium">{actionSuccess}</span>
            <button
              type="button"
              onClick={() => setActionSuccess("")}
              className="ml-2 text-xs font-bold text-[#15803D]/70 hover:text-[#15803D]"
            >
              ✕
            </button>
          </div>
        ) : null}

        <div className="flex overflow-x-auto border-b border-border gap-2 pb-px">
          <button
            type="button"
            onClick={() => {
              setTab("usage");
              window.history.replaceState(null, "", "/feed?tab=usage");
            }}
            className={[
              "flex items-center gap-2 shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-all",
              tab === "usage"
                ? "border-primary text-primary-hover bg-primary/5 rounded-t-[8px]"
                : "border-transparent text-muted hover:text-foreground hover:bg-muted/5",
            ].join(" ")}
          >
            <Wheat className="h-4 w-4" />
            <span>Pemakaian</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("formula");
              window.history.replaceState(null, "", "/feed?tab=formula");
            }}
            className={[
              "flex items-center gap-2 shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-all",
              tab === "formula"
                ? "border-primary text-primary-hover bg-primary/5 rounded-t-[8px]"
                : "border-transparent text-muted hover:text-foreground hover:bg-muted/5",
            ].join(" ")}
          >
            <span>Formula Pakan</span>
            <span
              className={[
                "rounded-full px-2 py-0.5 text-xs font-medium",
                tab === "formula"
                  ? "bg-primary text-white"
                  : "bg-[#F3F4F6] text-muted",
              ].join(" ")}
            >
              {data.formulas.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("ingredient");
              window.history.replaceState(null, "", "/feed?tab=ingredient");
            }}
            className={[
              "flex items-center gap-2 shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-all",
              tab === "ingredient"
                ? "border-primary text-primary-hover bg-primary/5 rounded-t-[8px]"
                : "border-transparent text-muted hover:text-foreground hover:bg-muted/5",
            ].join(" ")}
          >
            <span>Bahan Pakan</span>
            <span
              className={[
                "rounded-full px-2 py-0.5 text-xs font-medium",
                tab === "ingredient"
                  ? "bg-primary text-white"
                  : "bg-[#F3F4F6] text-muted",
              ].join(" ")}
            >
              {data.ingredients.length}
            </span>
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