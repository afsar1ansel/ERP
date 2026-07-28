import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import Select from "react-select";
import axios from "axios";

interface Props {
  token: string;
  categoriesValue: any[];
  materialsValue: any[];
  onChange: (data: {
    categories: { id: string; name: string }[];
    materials: { id: string; name: string }[];
  }) => void;
  baseUrl: string;
  mode: "add" | "edit";
}

interface Category {
  id: string;
  name: string;
}

interface Material {
  id: string;
  name: string;
  categoryId: string;
}

export default function CategoryMaterialSelect({
  token,
  categoriesValue,
  materialsValue,
  onChange,
  baseUrl,
  mode,
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  // 🧠 Normalize function to ensure we always work with {id, name}
  const normalizeData = (
    arr: any[],
    referenceList: { id: string; name: string }[]
  ): { id: string; name: string }[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .map((item) => {
        if (typeof item === "object" && item !== null && item.id && item.name)
          return item; // already correct shape
        if (typeof item === "string") {
          // could be id or name
          const ref =
            referenceList.find((r) => r.id === item) ||
            referenceList.find(
              (r) => r.name.toLowerCase() === item.toLowerCase()
            );
          return ref ? { id: ref.id, name: ref.name } : null;
        }
        return null;
      })
      .filter(Boolean) as { id: string; name: string }[];
  };

  // 🔹 Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(
          `${baseUrl}/raw-material-categories/get-categories/${token}`
        );
        const data = res.data.map((c: any) => ({
          id: String(c.id),
          name: c.category_name,
        }));
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, [token, baseUrl]);

  // 🔹 Fetch materials whenever categories change
  useEffect(() => {
    const fetchMaterials = async () => {
      const normalizedCategories = normalizeData(categoriesValue, categories);
      if (normalizedCategories.length === 0) {
        setMaterials([]);
        onChange({ categories: [], materials: [] });
        return;
      }

      try {
        let allMaterials: Material[] = [];

        for (const category of normalizedCategories) {
          const res = await axios.get(
            `${baseUrl}/raw-material-categories/get-materials-by-category/${category.id}/${token}`
          );
          const mats = res.data.map((m: any) => ({
            id: String(m.id),
            name: m.material_name,
            categoryId: category.id,
          }));
          allMaterials = [...allMaterials, ...mats];
        }

        setMaterials(allMaterials);

        // Filter and normalize materials
        const validMaterialIds = allMaterials.map((m) => m.id);
        const normalizedMaterials = normalizeData(materialsValue, allMaterials);
        const filteredMaterials = normalizedMaterials.filter((m) =>
          validMaterialIds.includes(m.id)
        );

        if (filteredMaterials.length !== materialsValue.length) {
          onChange({
            categories: normalizedCategories,
            materials: filteredMaterials,
          });
        }
      } catch (error) {
        console.error("Failed to fetch materials", error);
      }
    };

    if (categories.length > 0) fetchMaterials();
  }, [categoriesValue, token, baseUrl, categories]);

  const normalizedCategories = normalizeData(categoriesValue, categories);
  const normalizedMaterials = normalizeData(materialsValue, materials);

  return (
    <div className="">
      {/* ✅ Categories Multi Select */}
      <div className=" space-y-2">
        <Label>Categories</Label>
        <Select
          isMulti
          options={categories.map((c) => ({
            value: c.id,
            label: c.name,
          }))}
          value={normalizedCategories.map((c) => ({
            value: c.id,
            label: c.name,
          }))}
          onChange={(selected) => {
            const newCategories = selected.map((s: any) => ({
              id: s.value,
              name: s.label,
            }));
            onChange({
              categories: newCategories,
              materials: normalizedMaterials,
            });
          }}
          placeholder="Select categories"
        />
      </div>

      {/* ✅ Materials Multi Select */}
      {normalizedCategories.length > 0 && (
        <div className=" space-y-2">
          <Label>Materials</Label>
          <Select
            isMulti
            options={materials.map((m) => ({
              value: m.id,
              label: m.name,
            }))}
            value={normalizedMaterials.map((m) => ({
              value: m.id,
              label: m.name,
            }))}
            onChange={(selected) => {
              const newMaterials = selected.map((s: any) => ({
                id: s.value,
                name: s.label,
              }));
              onChange({
                categories: normalizedCategories,
                materials: newMaterials,
              });
            }}
            placeholder="Select materials"
          />
        </div>
      )}
    </div>
  );
}
