import { Tree } from "@angular-devkit/schematics";
import { SchematicTestRunner } from "@angular-devkit/schematics/testing";
import * as path from "path";

const collectionPath = path.join(__dirname, "../../src/collection.json");

function file(name: string) {
    return path.join(__dirname, "files", name);
}

describe("spec", () => {
    it("throws when name is not passed in", () => {
        const runner = new SchematicTestRunner("schematics", collectionPath);
        expect(() => runner.runSchematic("spec", {}, Tree.empty())).toThrow();
    });

    it("creates a file when name is passed in", () => {
        const runner = new SchematicTestRunner("schematics", collectionPath);
        const result = runner.runSchematic("spec", { name: file("empty-class.ts") }, Tree.empty());
        expect(result.files[0]).toMatch("empty-class.spec.ts");
    });

    it("creates a file with a non-empty content ", () => {
        // arrange
        const runner = new SchematicTestRunner("schematics", collectionPath);
        // act
        const result = runner.runSchematic("spec", { name: file("empty-class.ts") }, Tree.empty());
        // assert
        expect(result.readContent(result.files[0]).length).toBeGreaterThan(0);
    });

    describe("targeting the EmptyClass", () => {
        it("creates a file with the boilerplate setup method ", () => {
            // arrange
            const runner = new SchematicTestRunner("schematics", collectionPath);
            // act
            const result = runner.runSchematic(
                "spec",
                { name: file("empty-class.ts") },
                Tree.empty()
            );
            // assert
            const contents = result.readContent(result.files[0]);
            expect(contents).toMatch(/function setup\(\) {/);
            expect(contents).toMatch(/const builder = {/);
            expect(contents).toMatch(/return new EmptyClass\(\);/);
        });
    });

    describe("targeting the has-one-constructor-param class", () => {
        it("it creates boilerplate with a new instance with one matching constructor parameter ", () => {
            // arrange
            const runner = new SchematicTestRunner("schematics", collectionPath);
            // act
            const result = runner.runSchematic(
                "spec",
                { name: file("has-one-constructor-parameter.ts") },
                Tree.empty()
            );
            // assert
            const contents = result.readContent(result.files[0]);
            expect(contents).toMatch(/return new HasOneConstructorParameter\(service\);/);
        });
    });

    describe("targeting the example component class", () => {
        it("creates a file with matching number of `it` calls for each public method ", () => {
            // arrange
            const runner = new SchematicTestRunner("schematics", collectionPath);
            // act
            const result = runner.runSchematic(
                "spec",
                { name: file("example.component.ts") },
                Tree.empty()
            );
            // assert
            const contents = result.readContent(result.files[0]);
            expect(contents).toMatch(/it\('when aMethod is called/);
            expect(contents).toMatch(/it\('when anotherMethod is called/);
            expect(contents).toMatch(/it\('when fourth is called/);
            expect(contents).not.toMatch(
                /it\('when third is called/,
                "method `third` is private - we should not create a test for it "
            );
            expect(contents).not.toMatch(
                /it\('when protectedMethod is called/,
                "method `protectedMethod` is protected - we should not create a test for it "
            );
        });

        it("creates a file with `it` tests actually calling the public methods of the component/class ", () => {
            // arrange
            const runner = new SchematicTestRunner("schematics", collectionPath);
            // act
            const result = runner.runSchematic(
                "spec",
                { name: file("example.component.ts") },
                Tree.empty()
            );
            // assert
            const contents = result.readContent(result.files[0]);
            expect(contents).toMatch(/it\('when aMethod is called/); // the `it` test method
            expect(contents).toMatch(/\.aMethod\(\)/g); // the call to the component's `aMethod` method
        });
    });

    fdescribe("with pre-exising spec (UPDATE)", () => {
        it("removes the removed dependencies", () => {
            // arrange
            const runner = new SchematicTestRunner("schematics", collectionPath);
            // start with and empty tree (i.e. file system - or a part of one)
            const tree = Tree.empty();
            // a class with anotherStr and anotherSer as constructor parameters
            tree.create(
                "to-update.ts",
                `export class ToUpdate {
        constructor(anotherStr: string, anotherSer: Object) {}
      }`
            );
            // create a .spec file next to to-update.ts with the anotherStr and anotherServ as constructor parameters
            tree.create(
                "to-update.spec.ts",
                `import { ToUpdate } from "./to-update";

      describe("ToUpdate", () => {});

      function setup() {
        let stringDependency: string;
        const service = autoSpy(Object);
        const builder = {
          stringDependency,
          service,
          default() {
            return builder;
          },
          build() {
            return new ToUpdate(stringDependency, service);
          }
        };

        return builder;
      }`
            );
            // act
            // ToUpdate class has new deps - so we need to update the existing spec file
            const result = runner.runSchematic("spec", { name: "to-update.ts" }, tree);
            // assert
            const contents = result.readContent(result.files[0]);
            // console.log(contents);
            expect(contents.includes("spec")).toBeFalsy();
        });
    });
});
