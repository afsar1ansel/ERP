import { Label } from "@/components/ui/label";
import Select from "react-select";

const StorageLocationSingleSelect = ({
  locations,
  formData,
  handleInputChange,
}) => {
  // Convert locations to react-select format
  const locationOptions = locations.map((loc) => ({
    value: loc.id,
    label: loc.name,
  }));

  // Find selected option for single select
  const selectedOption = locationOptions.find(
    (option) => option.value === formData.storageLocation
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="storageLocation">Storage Location *</Label>
      <Select
        id="storageLocation"
        options={locationOptions}
        value={selectedOption || null}
        onChange={(selected) =>
          handleInputChange(
            "storageLocation",
            selected ? selected.value : null
          )
        }
        placeholder="Select location"
        className="basic-single-select"
        classNamePrefix="select"
        isClearable
      />
    </div>
  );
};

export default StorageLocationSingleSelect;
