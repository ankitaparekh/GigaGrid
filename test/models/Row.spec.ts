import {SubtotalRow} from "../../src/models/Row";

describe('SubtotalRow basic property test', ()=> {

    const subtotalRow = new SubtotalRow({
        title: "Parent",
        value: 100
    });

    it("has a bucket -> title", () => {
        expect(subtotalRow.bucketInfo.title).toBe("Parent");
    });

    it("has a bucket -> value", () => {
        expect(subtotalRow.bucketInfo.value).toBe(100);
    });

    it("has a method `data()` that returns the the aggregated results of the row, and it should be initially empty", () => {
        expect(subtotalRow.data()).toEqual({});
    });

    it("has a property to indicate it should be collapsed (thus all children shall not be rendered during rasterization)", () => {
        expect(subtotalRow.isCollapsed()).toBe(false);
        subtotalRow.toggleCollapse();
        expect(subtotalRow.isCollapsed()).toBe(true);
        subtotalRow.toggleCollapse(true);
        expect(subtotalRow.isCollapsed()).toBe(true);
        subtotalRow.toggleCollapse();
        expect(subtotalRow.isCollapsed()).toBe(false);
    });

});

describe("SubtotalRow with 2 children", () => {

    var childSubtotalRows:SubtotalRow[];
    var subtotalRow:SubtotalRow;

    beforeEach(()=> {
        childSubtotalRows = [
            new SubtotalRow({
                title: "Child 1",
                value: "Child 1"
            }),
            new SubtotalRow({
                title: "Child 2",
                value: "Child 2"
            })
        ];

        subtotalRow = new SubtotalRow({
            title: "Parent",
            value: 100
        });
        childSubtotalRows.forEach(child => {
            subtotalRow.addChild(child);
        });
    });

    it("has 2 children", () => {
        expect(subtotalRow.getNumChildren()).toBe(2);
    });

    it("can add handle adding child with duplicate title", () => {
        subtotalRow.addChild(new SubtotalRow({
            title: "Child 1",
            value: "Child 1"
        }));
        expect(subtotalRow.getNumChildren()).toBe(2);
    });

    it("can add handle adding child", () => {
        subtotalRow.addChild(new SubtotalRow({
            title: "Child 3",
            value: "Child 3"
        }));
        expect(subtotalRow.getNumChildren()).toBe(3);
    });

    it("can remove a child with the same title", ()=> {
        expect(subtotalRow.getChildByTitle("Child 1")).toBeDefined();
        subtotalRow.removeChild(new SubtotalRow({
            title: "Child 1",
            value: "Child 1"
        }));
        expect(subtotalRow.getChildByTitle("Child 1")).toBeUndefined();
    });

    it("can find a child by its title", () => {
        expect(subtotalRow.getChildByTitle("Child 1").bucketInfo.title).toBe("Child 1");
    });

    it("can find a child by its title or return null", () => {
        expect(subtotalRow.getChildByTitle("Never to Be Found")).toBeUndefined();
    });

    it("knows if it has a child with a given name", () => {
        expect(subtotalRow.hasChildWithTitle("Child 2")).toBeTruthy();
    });

});
