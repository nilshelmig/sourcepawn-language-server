import {
  Callback_implementations,
  Callback_implementation,
  Type,
  Argument,
  Range,
} from "../../src/parser";
import { AST_of, from, no_arguments, types } from "./AST_helpers";

function callback_implementation(
  name: string,
  returnType: Type,
  args: ReadonlyArray<Argument>,
  range: Range
): Callback_implementation {
  return {
    range,
    returnType,
    name,
    args,
  };
}

test("parsing callback implementation", () => {
  var implementations = Callback_implementations(
    AST_of("public void OnPluginStart() {}")
  );

  expect(implementations).toEqual([
    callback_implementation(
      "OnPluginStart",
      types.void,
      no_arguments,
      from(0, 0).to(0, 30)
    ),
  ]);
});
