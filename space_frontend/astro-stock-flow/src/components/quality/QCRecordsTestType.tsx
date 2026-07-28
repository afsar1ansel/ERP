import React from "react";
import Select from "react-select";

interface TestTypeOption {
  id: string;
  name: string;
}

interface Props {
  formData: {
    testType: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{ testType: string }>>;
  testTypes: TestTypeOption[];
}

export default function QCRecordsTestType({
  formData,
  setFormData,
  testTypes,
}: Props) {
  // Convert your test types to react-select's expected format
  const options = testTypes.map((type) => ({
    value: type.id,
    label: type.name,
  }));

  // Find the selected option based on formData.testType
  const selectedOption =
    options.find((option) => option.value == formData.testType) || null;

  return (
    <div className="space-y-2 mt-1.5">
      <label className="block mb-2 font-medium text-sm text-gray-700">
        Test Type *
      </label>
      <Select
        options={options}
        value={selectedOption}
        onChange={(selected) =>
          setFormData((prev) => ({
            ...prev,
            testType: selected ? selected.value : "",
          }))
        }
        placeholder="Select test type"
        isClearable
        className="space-y-2"
      />
    </div>
  );
}
