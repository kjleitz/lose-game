import type { JSX } from "react";
import type { EditingTool, ToolProperty } from "../types/EditingTools";

interface PropertyPanelProps {
  tool: EditingTool | null;
  values: Record<string, unknown>;
  onChange: (propertyId: string, value: unknown) => void;
  className?: string;
}

export function PropertyPanel({
  tool,
  values,
  onChange,
  className,
}: PropertyPanelProps): JSX.Element {
  if (!tool || tool.properties.length === 0) {
    return (
      <div className={`hud-panel p-4 ${className ?? ""}`}>
        <h3 className="hud-text text-lg font-semibold mb-4">Properties</h3>
        <p className="text-gray-400 text-sm">Select a tool to view its properties</p>
      </div>
    );
  }

  return (
    <div className={`hud-panel p-4 ${className ?? ""}`}>
      <h3 className="hud-text text-lg font-semibold mb-4">Properties</h3>
      <h4 className="hud-text text-sm font-medium mb-3 opacity-75">{tool.name}</h4>

      <div className="space-y-4">
        {tool.properties.map((property) => (
          <PropertyField
            key={property.id}
            property={property}
            value={values[property.id] ?? property.defaultValue}
            onChange={(value) => onChange(property.id, value)}
          />
        ))}
      </div>
    </div>
  );
}

interface PropertyFieldProps {
  property: ToolProperty;
  value: unknown;
  onChange: (value: unknown) => void;
}

function PropertyField({ property, value, onChange }: PropertyFieldProps): JSX.Element {
  const fieldId = `property-${property.id}`;

  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-300">
        {property.name}
      </label>

      {property.type === "number" && (
        <NumberField
          id={fieldId}
          value={typeof value === "number" ? value : 0}
          onChange={onChange}
          min={property.min}
          max={property.max}
          step={property.step}
        />
      )}

      {property.type === "string" && (
        <StringField
          id={fieldId}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
        />
      )}

      {property.type === "boolean" && (
        <BooleanField
          id={fieldId}
          value={typeof value === "boolean" ? value : false}
          onChange={onChange}
        />
      )}

      {property.type === "select" && (
        <SelectField
          id={fieldId}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          options={property.options ?? []}
        />
      )}

      {property.type === "color" && (
        <ColorField
          id={fieldId}
          value={typeof value === "string" ? value : "#ffffff"}
          onChange={onChange}
        />
      )}
    </div>
  );
}

interface NumberFieldProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function NumberField({ id, value, onChange, min, max, step }: NumberFieldProps): JSX.Element {
  return (
    <div className="flex items-center space-x-2">
      <input
        id={id}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        min={min}
        max={max}
        step={step}
        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-16 px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded text-white"
      />
    </div>
  );
}

interface StringFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

function StringField({ id, value, onChange }: StringFieldProps): JSX.Element {
  return (
    <input
      id={id}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
    />
  );
}

interface BooleanFieldProps {
  id: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function BooleanField({ id, value, onChange }: BooleanFieldProps): JSX.Element {
  return (
    <label htmlFor={id} className="flex items-center space-x-2 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        className="w-4 h-4 text-amber-400 bg-gray-800 border-gray-600 rounded focus:ring-amber-400"
      />
      <span className="text-sm text-gray-300">Enabled</span>
    </label>
  );
}

interface SelectFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function SelectField({ id, value, onChange, options }: SelectFieldProps): JSX.Element {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface ColorFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorField({ id, value, onChange }: ColorFieldProps): JSX.Element {
  return (
    <div className="flex items-center space-x-2">
      <input
        id={id}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-8 h-8 border border-gray-600 rounded cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm font-mono"
        placeholder="#ffffff"
      />
    </div>
  );
}
