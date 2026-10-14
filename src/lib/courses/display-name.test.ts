import { describe, expect, it } from "vitest";

import {
  readableCourseCode,
  readableCourseName,
  readableMeetingTitle,
  withReadableCourse,
} from "@/lib/courses/display-name";

describe("readable course display names", () => {
  it("maps known catalog codes to simple names and drops section numbers", () => {
    expect(
      readableCourseName({ code: "CSCI 2340", title: "CSCI 2340 Object Oriented Design" }),
    ).toBe("Object Oriented Design");
    expect(readableCourseName({ code: "BUSN 1001", title: "BUSN 1001" })).toBe(
      "Intro to Business",
    );
    expect(
      readableCourseName({
        code: "CSCI 1250",
        title: "CSCI 1250 0711 Intro to Computer Programming",
      }),
    ).toBe("Intro to Computer Programming");
    expect(readableCourseName({ code: null, title: "CSCI 1250 0711" })).toBe(
      "Computer Programming",
    );
  });

  it("keeps a human title for unknown courses and strips section numbers from codes", () => {
    expect(
      readableCourseName({ code: "MATH 2010", title: "MATH 2010 0711 Calculus I" }),
    ).toBe("Calculus I");
    expect(readableCourseCode({ code: "CSCI 1250 0711", title: "CSCI 1250 0711" })).toBe(
      "CSCI 1250",
    );
    expect(
      withReadableCourse({
        id: "1",
        title: "CSCI 2340 0711",
        code: "CSCI 2340 0711",
      }),
    ).toEqual({
      id: "1",
      title: "Object Oriented Design",
      code: "CSCI 2340",
    });
  });

  it("strips Moodle slash fullnames down to the course name", () => {
    expect(
      readableCourseName({
        code: "CSCI2340.172I.2026.FALL.ELEARN1",
        title:
          "CSCI 2340/LEC/172I-2026/FALL/ELEARN1 - Object-Oriented Design",
      }),
    ).toBe("Object-Oriented Design");
    expect(
      readableCourseName({
        code: "BUSN1001.171I",
        title:
          "BUSN 1001.171I,BUSN 1001.171I/LEC/171I-2026/FALL/1SESSION - Introduction to Business",
      }),
    ).toBe("Introduction to Business");
    expect(
      readableCourseName({
        code: "CSCI1250.071I",
        title:
          "CSCI 1250.071I,CSCI 1250.071I/LEC/071I-2026/FALL/ELEARN0 - Introduction to  Computer Programming",
      }),
    ).toBe("Introduction to Computer Programming");
  });

  it("replaces catalog-only meeting labels but keeps custom names", () => {
    const course = { title: "CSCI 1250 0711", code: "CSCI 1250" };
    expect(readableMeetingTitle("CSCI 1250 0711", course)).toBe("Computer Programming");
    expect(readableMeetingTitle("Lab", course)).toBe("Computer Programming lab");
    expect(readableMeetingTitle("CSCI lecture", course)).toBe("Computer Programming");
    expect(readableMeetingTitle("Office hours", course)).toBe("Office hours");
  });
});
