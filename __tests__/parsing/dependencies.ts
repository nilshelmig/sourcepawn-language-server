import { Range, IncludeType, Dependencies, Dependency } from "../../src/parser";
import { AST_of, from } from "./AST_helpers";

function global_dependency(name: string, range: Range): Dependency {
  return {
    includeType: IncludeType.Global_Include,
    required: true,
    path: name,
    range,
  };
}

function relative_dependency(path: string, range: Range): Dependency {
  return {
    includeType: IncludeType.Relative_Include,
    required: true,
    path,
    range,
  };
}

function optional_global_dependency(name: string, range: Range): Dependency {
  return {
    includeType: IncludeType.Global_Include,
    required: false,
    path: name,
    range,
  };
}

function optional_relative_dependency(path: string, range: Range): Dependency {
  return {
    includeType: IncludeType.Relative_Include,
    required: false,
    path,
    range,
  };
}

test("parse include preprocessor directive - global inc", () => {
  let dependencies = Dependencies(AST_of("#include <sourcemod>"));
  expect(dependencies).toEqual([
    global_dependency("sourcemod.inc", from(0, 0).to(0, 20)),
  ]);
});

test("parse include preprocessor directive - relative inc without extension", () => {
  let dependencies = Dependencies(AST_of(`#include "../mylib"`));
  expect(dependencies).toEqual([
    relative_dependency("../mylib.inc", from(0, 0).to(0, 19)),
  ]);
});

test("parse include preprocessor directive - relative inc with extension", () => {
  let dependencies = Dependencies(AST_of(`#include "../mylib.inc"`));
  expect(dependencies).toEqual([
    relative_dependency("../mylib.inc", from(0, 0).to(0, 23)),
  ]);
});

test("parse tryinclude preprocessor directive - global inc", () => {
  let dependencies = Dependencies(AST_of("#tryinclude <sourcemod>"));
  expect(dependencies).toEqual([
    optional_global_dependency("sourcemod.inc", from(0, 0).to(0, 23)),
  ]);
});

test("parse tryinclude preprocessor directive - relative inc without extension", () => {
  let dependencies = Dependencies(AST_of(`#tryinclude "../mylib"`));
  expect(dependencies).toEqual([
    optional_relative_dependency("../mylib.inc", from(0, 0).to(0, 22)),
  ]);
});

test("parse tryinclude preprocessor directive - relative inc with extension", () => {
  let dependencies = Dependencies(AST_of(`#tryinclude "../mylib.inc"`));
  expect(dependencies).toEqual([
    optional_relative_dependency("../mylib.inc", from(0, 0).to(0, 26)),
  ]);
});
