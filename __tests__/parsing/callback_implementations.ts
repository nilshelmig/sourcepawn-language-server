import {
  Callback_implementations,
  Callback_implementation,
  Type,
  Argument,
  Range,
} from "../../src/parser";
import { argument, AST_of, from, no_arguments, types } from "./AST_helpers";

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
  let implementations = Callback_implementations(
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

test("with one argument", () => {
  let implementations = Callback_implementations(
    AST_of(`
      public void OnClientDisconnected(int client) {

      }

      public void OnSoundPlayed(char[] sound) {
      
      }

      public void OnPluginStart(bool lazystart) {
      
      }

      public void OnThingHappen(float value) {
      
      }

      public void OnRebuildAdminCache(AdminCachePart part) {
      
      }
    `)
  );

  expect(implementations).toEqual([
    callback_implementation(
      "OnClientDisconnected",
      types.void,
      [argument("client", types.int)],
      from(1, 6).to(3, 7)
    ),
    callback_implementation(
      "OnSoundPlayed",
      types.void,
      [argument("sound", types.dimensional(1, types.char))],
      from(5, 6).to(7, 7)
    ),
    callback_implementation(
      "OnPluginStart",
      types.void,
      [argument("lazystart", types.bool)],
      from(9, 6).to(11, 7)
    ),
    callback_implementation(
      "OnThingHappen",
      types.void,
      [argument("value", types.float)],
      from(13, 6).to(15, 7)
    ),
    callback_implementation(
      "OnRebuildAdminCache",
      types.void,
      [argument("part", types.custom("AdminCachePart"))],
      from(17, 6).to(19, 7)
    ),
  ]);
});

test("multiple arguments", () => {
  let implementations = Callback_implementations(
    AST_of(
      `public void OnClientSayCommand_Post(int client, const char[] command, char[] sArgs, float time, bool teamchat, float vec[3]) {}`
    )
  );

  expect(implementations).toEqual([
    callback_implementation(
      "OnClientSayCommand_Post",
      types.void,
      [
        argument("client", types.int),
        argument("command", types.dimensional(1, types.char)),
        argument("sArgs", types.dimensional(1, types.char)),
        argument("time", types.float),
        argument("teamchat", types.bool),
        argument("vec", types.dimensional(1, types.float)),
      ],
      from(0, 0).to(0, 127)
    ),
  ]);
});

test("different return types", () => {
  let implementations = Callback_implementations(
    AST_of(`
      public int Callback1() {}
      public float Callback2() {}
      public char Callback3() {}
      public bool Callback4() {}
      public Action Callback5() {}
    `)
  );

  expect(implementations).toEqual([
    callback_implementation(
      "Callback1",
      types.int,
      no_arguments,
      from(1, 6).to(1, 31)
    ),
    callback_implementation(
      "Callback2",
      types.float,
      no_arguments,
      from(2, 6).to(2, 33)
    ),
    callback_implementation(
      "Callback3",
      types.char,
      no_arguments,
      from(3, 6).to(3, 32)
    ),
    callback_implementation(
      "Callback4",
      types.bool,
      no_arguments,
      from(4, 6).to(4, 32)
    ),
    callback_implementation(
      "Callback5",
      types.custom("Action"),
      no_arguments,
      from(5, 6).to(5, 34)
    ),
  ]);
});

test("Old style", () => {
  let implementations = Callback_implementations(
    AST_of(`
      public Callback1() {}
      public Callback2(client) {}
      public Callback3(Float:value) {}
      public Callback4(String:type) {}
      public Callback5(const String:name[]) {}
      public Callback6(Handle:handle) {}
      public Callback7(_:client) {}
    `)
  );

  expect(implementations).toEqual([
    callback_implementation(
      "Callback1",
      types.int,
      no_arguments,
      from(1, 6).to(1, 27)
    ),
    callback_implementation(
      "Callback2",
      types.int,
      [argument("client", types.int)],
      from(2, 6).to(2, 33)
    ),
    callback_implementation(
      "Callback3",
      types.int,
      [argument("value", types.float)],
      from(3, 6).to(3, 38)
    ),
    callback_implementation(
      "Callback4",
      types.int,
      [argument("type", types.char)],
      from(4, 6).to(4, 38)
    ),
    callback_implementation(
      "Callback5",
      types.int,
      [argument("name", types.dimensional(1, types.char))],
      from(5, 6).to(5, 46)
    ),
    callback_implementation(
      "Callback6",
      types.int,
      [argument("handle", types.custom("Handle"))],
      from(6, 6).to(6, 40)
    ),
    callback_implementation(
      "Callback7",
      types.int,
      [argument("client", types.int)],
      from(7, 6).to(7, 35)
    ),
  ]);
});

test("old style different return types", () => {
  let implementations = Callback_implementations(
    AST_of(`
      public Callback1() {}
      public _:Callback2() {}
      public Float:Callback3() {}
      public String:Callback4() {}
      public bool:Callback5() {}
      public Action:Callback6() {}
    `)
  );

  expect(implementations).toEqual([
    callback_implementation(
      "Callback1",
      types.int,
      no_arguments,
      from(1, 6).to(1, 27)
    ),
    callback_implementation(
      "Callback2",
      types.int,
      no_arguments,
      from(2, 6).to(2, 29)
    ),
    callback_implementation(
      "Callback3",
      types.float,
      no_arguments,
      from(3, 6).to(3, 33)
    ),
    callback_implementation(
      "Callback4",
      types.char,
      no_arguments,
      from(4, 6).to(4, 34)
    ),
    callback_implementation(
      "Callback5",
      types.bool,
      no_arguments,
      from(5, 6).to(5, 32)
    ),
    callback_implementation(
      "Callback6",
      types.custom("Action"),
      no_arguments,
      from(6, 6).to(6, 34)
    ),
  ]);
});
