/* eslint-disable */
/**
 * This file was automatically generated from:
 * https://raw.githubusercontent.com/bettyblocks/json-schema/master/schemas/actions/function.json
 * Do not edit it manually — run `bun run gen:function-schema` instead.
 */

/**
 * A function to be used in the IDE
 */
export type Function = (
  | {
      yields?: "PATHS";
      [k: string]: unknown;
    }
  | {
      yields?: "ALL" | "NONE";
      paths?: never;
      [k: string]: unknown;
    }
) & {
  /**
   * Indicates if the function is an expression or normal function
   */
  expression?: boolean;
  /**
   * The label for the function, as shown in the IDE
   */
  label: string;
  description: string;
  /**
   * The category by which the functions are grouped and shown in the sidebar.
   */
  category: string;
  /**
   * The icon to be displayed in the IDE for this function.
   */
  icon: {
    name: string;
    color:
      | "Yellow"
      | "Green"
      | "Pink"
      | "Orange"
      | "Purple"
      | "Blue"
      | "Teal"
      | "Grey";
  };
  /**
   * Determines the context in which the function is utilized, thereby offering context-specific options.
   */
  context?: "gqlBuffer"[];
  /**
   * The options that you want configured for the action. These can be referred by name inside the function
   */
  options?: Options[];
  paths?: Paths;
  /**
   * Determines whether the function can have other functions nested and if so, what the behaviour should be for executing those functions
   */
  yields: "NONE" | "PATHS" | "ALL";
  /**
   * WebAssembly function description
   */
  wasmDescription?: {
    /**
     * The name of the function that is exported in the wit file
     */
    functionName: string;
    /**
     * The wit file of the wasm component
     */
    wit: string;
    interface: {
      /**
       * The name of the interface set in the wit file
       */
      name: string;
      /**
       * The name of the package defined in the wit file, like: example:my-package@0.1.0
       */
      package: string;
    };
  };
};
/**
 * The definition of additional meta info for properties.
 */
export type AdditionalMetaInfoProperties = ("name" | "kind")[];
/**
 * The definition of additional meta info for models.
 */
export type AdditionalMetaInfoModels = (
  | "name"
  | {
      properties?: AdditionalMetaInfoProperties;
      [k: string]: unknown;
    }
)[];

/**
 * Options that can be configured for each Function. All the available types of options are found in the definitions.
 */
export interface Options {
  meta:
    | OptionsTypeAction
    | OptionsTypeAuthenticationProfile
    | OptionsTypeBoolean
    | OptionsTypeCollection
    | OptionsTypeInputVariableMap
    | OptionsTypeJSON
    | OptionsTypeMap
    | OptionsTypeModel
    | OptionsTypeMultilineText
    | OptionsTypeNumber
    | OptionsTypeObject
    | OptionsTypeOutput
    | OptionsTypeProperty
    | OptionsTypePropertyMap
    | OptionsTypeRecord
    | OptionsTypeSelect
    | OptionsTypeSchemaModel
    | OptionsTypeText
    | OptionsTypeValue;
  /**
   * The name of the option. Can be used to reference this option. Should be unique within scope of function.
   */
  name: string;
  /**
   * The label for option, as shown in the IDE.
   */
  label: string;
  /**
   * Can be used to give more info on what this option does.
   */
  info?: string;
  /**
   * Flag to determine wether to show this in regular or advanced options.
   */
  advanced?: boolean;
  configuration?: Configuration;
}
/**
 * Properties specific to the Action option type.
 */
export interface OptionsTypeAction {
  type?: "Action";
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the AuthenticationProfile option type.
 */
export interface OptionsTypeAuthenticationProfile {
  type?: "AuthenticationProfile";
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the Boolean option type.
 */
export interface OptionsTypeBoolean {
  type?: "Boolean";
  /**
   * The default value of the option
   */
  default?: boolean;
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the Collection option type.
 */
export interface OptionsTypeCollection {
  type?: "Collection";
  additional?: AdditionalMetaInfo;
  /**
   * A lazy collection allows to have a reference to a collection without actually getting all the records. This option controls if the input collection is a lazy collection, it will keep it as is. If this is set to false it will get all the records belonging to this collection before executing the function
   */
  allowLazyCollection?: boolean;
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * The definition of additional meta info.
 */
export interface AdditionalMetaInfo {
  model?: AdditionalMetaInfoModels;
}
/**
 * Properties specific to the InputVariableMap option type.
 */
export interface OptionsTypeInputVariableMap {
  type?: "InputVariableMap";
  /**
   * The action on which the input variables are based. Should refer to another option name which is of type Action.
   */
  action: string;
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the JSON option type.
 */
export interface OptionsTypeJSON {
  type?: "JSON";
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the Map option type.
 */
export interface OptionsTypeMap {
  type?: "Map";
  /**
   * A lazy collection allows to have a reference to a collection without actually getting all the records. This option controls if the input collection is a lazy collection, it will keep it as is. If this is set to false it will get all the records belonging to this collection before executing the function
   */
  allowLazyCollection?: boolean;
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the Model option type.
 */
export interface OptionsTypeModel {
  type?: "Model";
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the MultilineText option type.
 */
export interface OptionsTypeMultilineText {
  type?: "MultilineText";
  /**
   * The default value of the option
   */
  default?: string;
  /**
   * The placeholder value of the option
   */
  placeholder?: string;
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the Number option type.
 */
export interface OptionsTypeNumber {
  type?: "Number";
  /**
   * The default value of the option
   */
  default?: number;
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    min?: number;
    max?: number;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the Object option type.
 */
export interface OptionsTypeObject {
  type?: "Object";
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the Output option type.
 */
export interface OptionsTypeOutput {
  type?: "Output";
  output?:
    | {
        type?: "Boolean" | "JSON" | "Number" | "Text";
        scoped?: boolean;
      }
    | {
        type?: "Collection";
        model: string;
        scoped?: boolean;
      }
    | {
        type?: "Inherit";
        source: string;
        toSingleItem?: boolean;
        scoped?: boolean;
      }
    | {
        type?: "Record";
        model: string;
        scoped?: boolean;
      }
    | {
        type?: "Object";
        schemaModel?: string;
        scoped?: boolean;
      }
    | (
        | {
            dataType?: "SCHEMA";
            [k: string]: unknown;
          }
        | {
            dataType?: "INTEGER" | "STRING";
            schemaModel?: never;
            [k: string]: unknown;
          }
      )
    | {
        scoped?: boolean;
        anyOf?: (
          | {
              type?: "Boolean" | "JSON" | "Number" | "Text";
              scoped?: boolean;
            }
          | {
              type?: "Collection";
              model: string;
              scoped?: boolean;
            }
          | {
              type?: "Record";
              model: string;
              scoped?: boolean;
            }
          | {
              type?: "Object";
              schemaModel?: string;
              scoped?: boolean;
            }
          | (
              | {
                  dataType?: "SCHEMA";
                  [k: string]: unknown;
                }
              | {
                  dataType?: "INTEGER" | "STRING";
                  schemaModel?: never;
                  [k: string]: unknown;
                }
            )
        )[];
      };
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the Property option type.
 */
export interface OptionsTypeProperty {
  type?: "Property";
  /**
   * The model on which the properties are based. Should refer to another option name which is model based.
   */
  model: string;
  /**
   * The kinds you want to allow for this property
   */
  allowedKinds?: (
    | "BOOLEAN"
    | "DATE_TIME"
    | "DATE"
    | "DECIMAL"
    | "EMAIL_ADDRESS"
    | "FILE"
    | "IMAGE"
    | "INTEGER"
    | "LIST"
    | "OBJECT"
    | "PRICE"
    | "SERIAL"
    | "STRING"
    | "TEXT"
    | "URL"
  )[];
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the PropertyMap option type.
 */
export interface OptionsTypePropertyMap {
  type?: "PropertyMap";
  /**
   * The model on which the properties are based. Should refer to another option name which is model based.
   */
  model: string;
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the Record option type.
 */
export interface OptionsTypeRecord {
  type?: "Record";
  additional?: AdditionalMetaInfo;
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the Select option type.
 */
export interface OptionsTypeSelect {
  type?: "Select";
  /**
   * The default value of the option should match one of the values in the values array.
   */
  default?: string;
  /**
   * The options that you want configured for the select.
   */
  values: {
    value?: string;
    label?: string;
    [k: string]: unknown;
  }[];
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the SchemaModel option type.
 */
export interface OptionsTypeSchemaModel {
  type?: "SchemaModel";
  /**
   * Controls the visibility of the option.
   */
  visibility?: "hidden" | "readonly" | "visible";
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the Text option type.
 */
export interface OptionsTypeText {
  type?: "Text";
  /**
   * The default value of the option
   */
  default?: string;
  /**
   * The placeholder value of the option
   */
  placeholder?: string;
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * Properties specific to the Value option type.
 */
export interface OptionsTypeValue {
  type?: "Value";
  /**
   * The options that you want configured for the value.
   */
  allowedKinds: (
    | "ARRAY"
    | "BOOLEAN"
    | "COLLECTION"
    | "FILE"
    | "IMAGE"
    | "INTEGER"
    | "JSON"
    | "OBJECT"
    | "RECORD"
    | "STRING"
  )[];
  /**
   * A lazy collection allows to have a reference to a collection without actually getting all the records. This option controls if the input collection is a lazy collection, it will keep it as is. If this is set to false it will get all the records belonging to this collection before executing the function
   */
  allowLazyCollection?: boolean;
  /**
   * Reference to a SchemaModel option by name. Only applicable when allowedKinds contains OBJECT or ARRAY.
   */
  schemaModel?: string;
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
/**
 * The option configurations for things like validation, visibility or defaults.
 */
export interface Configuration {
  placeholder?: string;
  /**
   * List of other options that this option depends on.
   */
  dependsOn?: {
    [k: string]: unknown;
  }[];
}
/**
 * The paths that you want configured for the action step.
 */
export interface Paths {
  min: number;
  max: number;
  filterOption: {
    name?: "value";
    meta: OptionsTypeValue | OptionsTypeFilter | OptionsTypeMultilineText;
    [k: string]: unknown;
  };
  values: {
    label: string;
  }[];
}
/**
 * Properties specific to the Filter option type.
 */
export interface OptionsTypeFilter {
  type?: "Filter";
  /**
   * The requirements for the given option.
   */
  validations?: {
    required?: boolean;
    [k: string]: unknown;
  };
}
