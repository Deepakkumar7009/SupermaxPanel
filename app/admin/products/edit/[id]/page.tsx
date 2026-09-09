"use client";

import { useState, useEffect, FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import { RootState, AppDispatch } from "@/redux/store";
import { fetchProducts, updateProduct } from "@/redux/thunks/productThunks";
import { fetchCategories } from "@/redux/thunks/categoryThunks";

import FloatingInput from "@/components/common/FloatingInput";
import MultiSelect from "@/components/common/MultiSelect";
import Select from "@/components/common/Select";
import Button from "@/components/common/Button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, PackageCheck, IndianRupee, Ruler } from "lucide-react";

const SectionHeader = ({
  icon: Icon,
  label,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  iconBg: string;
  iconColor: string;
}) => (
  <div className="flex items-center gap-2 mb-4">
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
      style={{ background: iconBg, color: iconColor }}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
    <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</h2>
  </div>
);

const EditProductPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const { categories } = useSelector((state: RootState) => state.category);
  const { products, loading } = useSelector((state: RootState) => state.product);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [stock, setStock] = useState(0);
  const [sku, setSku] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [brand, setBrand] = useState("");
  const [weight, setWeight] = useState("");
  const [dimStr, setDimStr] = useState("0,0,0");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const finalPrice = price - (price * discount) / 100;

  useEffect(() => {
    dispatch(fetchCategories({ limit: 500 }));
    if (products.length === 0) dispatch(fetchProducts({ limit: 9999 }));
  }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const product = products.find((p) => p._id === id);
    if (!product) {
      if (products.length > 0) setNotFound(true);
      return;
    }
    const d = product.dimensions;
    setName(product.name || "");
    setDescription(product.description || "");
    setPrice(product.price || 0);
    setDiscount(product.discount || 0);
    setStock(product.stock || 0);
    setSku(product.sku || "");
    setCategoryIds((product.categories ?? []).map((c) => c._id));
    setBrand(product.brand || "");
    setWeight(product.weight || "");
    setDimStr(d ? `${d.length ?? 0},${d.width ?? 0},${d.height ?? 0}` : "0,0,0");
    setTags((product.tags ?? []).join(", "));
    setImages((product.images ?? []).join(", "));
    setIsFeatured(product.isFeatured || false);
  }, [products, id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim())        { setError("Product name is required."); return; }
    if (price <= 0)          { setError("Price must be greater than 0."); return; }
    if (!categoryIds.length) { setError("Please select at least one category."); return; }
    if (!sku.trim())         { setError("SKU is required."); return; }

    const [l, w, h] = dimStr.split(",").map(Number);
    const result = await dispatch(updateProduct({
      id,
      updatedData: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description,
        price,
        discount,
        stock,
        sku,
        categories: categoryIds as unknown as { _id: string; name: string }[],
        brand,
        weight,
        dimensions: { length: l || 0, width: w || 0, height: h || 0 },
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        images: images.split(",").map((t) => t.trim()).filter(Boolean),
        isFeatured,
        isActive: true,
      },
    }));

    if (updateProduct.fulfilled.match(result)) {
      router.push("/admin/products");
    } else {
      setError("Failed to update product. Please try again.");
    }
  };

  const categoryOptions = categories.map((c) => ({ label: c.name, value: c._id }));
  const featuredOptions = [
    { label: "Yes", value: "yes" },
    { label: "No",  value: "no"  },
  ];

  if (notFound) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-lg font-semibold">Product not found.</p>
        <Link href="/admin/products" className="text-sm text-[var(--btn-primary-bg)] hover:underline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)] pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products">
          <Button type="button">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--form-icon-bg)", color: "var(--btn-primary-bg)" }}
          >
            <PackageCheck className="h-4 w-4" />
          </span>
          <h1 className="text-lg sm:text-xl font-semibold truncate">Edit Product</h1>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-[var(--form-error-border)] bg-[var(--form-error-bg)] text-[var(--text-error)] text-sm">
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Basic Information */}
        <Card className="p-4 sm:p-5 border-[var(--form-border)] bg-[var(--form-section-bg)]">
          <SectionHeader
            icon={PackageCheck}
            label="Basic Information"
            iconBg="var(--section-identity-bg)"
            iconColor="var(--section-identity-icon)"
          />
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                label="Product Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[var(--form-label)] font-medium">
                  Categories <span className="text-[var(--text-error)]">*</span>
                </label>
                <MultiSelect
                  options={categoryOptions}
                  value={categoryIds}
                  onChange={setCategoryIds}
                  placeholder="Select categories..."
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[var(--form-label)] font-medium">Description</label>
              <Textarea
                value={description}
                placeholder="Enter product description..."
                className="resize-none min-h-[90px] bg-[var(--form-field-bg)] border-[var(--form-border)] text-[var(--foreground)]"
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Pricing & Stock */}
        <Card className="p-4 sm:p-5 border-[var(--form-border)] bg-[var(--form-section-bg)]">
          <SectionHeader
            icon={IndianRupee}
            label="Pricing & Stock"
            iconBg="var(--section-pricing-bg)"
            iconColor="var(--section-pricing-icon)"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FloatingInput
              label="Price (₹) *"
              type="number"
              value={price.toString()}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            <FloatingInput
              label="Discount (%)"
              type="number"
              value={discount.toString()}
              onChange={(e) => setDiscount(Number(e.target.value))}
            />
            <FloatingInput
              label="Stock (units) *"
              type="number"
              value={stock.toString()}
              onChange={(e) => setStock(Number(e.target.value))}
            />
          </div>
          {price > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 px-4 py-2 rounded-lg bg-[var(--form-preview-bg)] border border-[var(--form-preview-border)] text-sm">
              <span className="text-[var(--muted-foreground)]">Final Price:</span>
              <span className="font-bold text-[var(--text-success)]">₹ {finalPrice.toFixed(2)}</span>
              {discount > 0 && (
                <span className="text-[var(--muted-foreground)] line-through text-xs">₹ {price}</span>
              )}
            </div>
          )}
        </Card>

        {/* Product Details */}
        <Card className="p-4 sm:p-5 border-[var(--form-border)] bg-[var(--form-section-bg)]">
          <SectionHeader
            icon={Ruler}
            label="Product Details"
            iconBg="var(--section-classification-bg)"
            iconColor="var(--section-classification-icon)"
          />
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FloatingInput
                label="SKU *"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              <FloatingInput
                label="Brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
              <FloatingInput
                label="Weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FloatingInput
                label="Dimensions (L,W,H)"
                value={dimStr}
                onChange={(e) => setDimStr(e.target.value)}
              />
              <FloatingInput
                label="Tags (comma separated)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <FloatingInput
                label="Image URLs (comma separated)"
                value={images}
                onChange={(e) => setImages(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 max-w-xs">
              <label className="text-xs text-[var(--form-label)] font-medium">Featured</label>
              <Select
                value={isFeatured ? "yes" : "no"}
                onChange={(v) => setIsFeatured(v === "yes")}
                options={featuredOptions}
                placeholder="Featured?"
                className="w-full max-w-full"
              />
            </div>
          </div>
        </Card>

        {/* Actions — inline on desktop, sticky on mobile */}
        <div className="hidden md:flex justify-end gap-3 pb-4">
          <Link href="/admin/products">
            <Button type="button">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : "Update Product"}
          </Button>
        </div>

        <div className="md:hidden fixed inset-x-0 bottom-0 z-10 flex gap-3 border-t border-[var(--sticky-bar-border)] bg-[var(--sticky-bar-bg)] backdrop-blur px-4 py-3">
          <Link href="/admin/products" className="flex-1">
            <Button type="button" className="w-full justify-center">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1 justify-center">
            {loading ? "Saving…" : "Update Product"}
          </Button>
        </div>

      </form>
    </div>
  );
};

export default EditProductPage;