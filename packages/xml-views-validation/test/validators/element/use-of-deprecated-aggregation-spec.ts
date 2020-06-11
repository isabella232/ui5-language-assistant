import { partial, find } from "lodash";
import { UI5SemanticModel } from "@ui5-language-assistant/semantic-model-types";
import {
  assertNoIssues as assertNoIssuesBase,
  assertSingleIssue as assertSingleIssueBase,
} from "../../test-utils";
import { generateModel } from "@ui5-language-assistant/test-utils";
import { validateUseOfDeprecatedAggregation } from "../../../src/validators/elements/use-of-depracated-aggregation";
import {
  buildDeprecatedIssueMessage,
  DeprecatedUI5Symbol,
} from "../../../src/utils/deprecated-message-builder";

describe("the use of deprecated aggregation validation", () => {
  let ui5SemanticModel: UI5SemanticModel;

  before(async () => {
    ui5SemanticModel = await generateModel({ version: "1.74.0" });
  });

  context("true positive scenarios", () => {
    let assertSingleIssue: (xmlSnippet: string, message: string) => void;
    before(() => {
      assertSingleIssue = partial(
        assertSingleIssueBase,
        ui5SemanticModel,
        {
          element: [validateUseOfDeprecatedAggregation],
        },
        "UseOfDeprecatedAggregation",
        "warn"
      );
    });

    it("will detect usage of a deprecated aggregation", () => {
      const bubbleChart =
        ui5SemanticModel.classes["sap.ca.ui.charts.BubbleChart"];
      const contentAggregation = find(
        bubbleChart.aggregations,
        (_) => _.name === "content"
      );

      assertSingleIssue(
        `<mvc:View xmlns:mvc="sap.ui.core.mvc" xmlns:charts="sap.ca.ui.charts">
          <mvc:content>
            <charts:BubbleChart>
                <🢂charts:content🢀>
                </charts:content>
            </charts:BubbleChart>
          </mvc:content>
        </m:View>`,
        buildDeprecatedIssueMessage({
          symbol: contentAggregation as DeprecatedUI5Symbol,
          modelVersion: ui5SemanticModel.version,
        })
      );
    });

    it("will detect usage of a deprecated aggregation with self closing syntax", () => {
      const bubbleChart =
        ui5SemanticModel.classes["sap.ca.ui.charts.BubbleChart"];
      const contentAggregation = find(
        bubbleChart.aggregations,
        (_) => _.name === "content"
      );

      assertSingleIssue(
        `<mvc:View xmlns:mvc="sap.ui.core.mvc" xmlns:charts="sap.ca.ui.charts">
          <mvc:content>
            <charts:BubbleChart>
                <🢂charts:content🢀/>
            </charts:BubbleChart>
          </mvc:content>
        </m:View>`,
        buildDeprecatedIssueMessage({
          symbol: contentAggregation as DeprecatedUI5Symbol,
          modelVersion: ui5SemanticModel.version,
        })
      );
    });

    it("will detect usage of a deprecated aggregation in an unclosed element to enable **early warning** to users", () => {
      const bubbleChart =
        ui5SemanticModel.classes["sap.ca.ui.charts.BubbleChart"];
      const contentAggregation = find(
        bubbleChart.aggregations,
        (_) => _.name === "content"
      );

      assertSingleIssue(
        `<mvc:View xmlns:mvc="sap.ui.core.mvc" xmlns:charts="sap.ca.ui.charts">
          <mvc:content>
            <charts:BubbleChart>
              <🢂charts:content🢀
            </charts:BubbleChart>
          </mvc:content>
        </m:View>`,
        buildDeprecatedIssueMessage({
          symbol: contentAggregation as DeprecatedUI5Symbol,
          modelVersion: ui5SemanticModel.version,
        })
      );
    });
  });

  context("negative edge cases", () => {
    let assertNoIssues: (xmlSnippet: string) => void;
    before(() => {
      assertNoIssues = partial(assertNoIssuesBase, ui5SemanticModel, {
        element: [validateUseOfDeprecatedAggregation],
      });
    });

    it("will not detect an issue when the aggregation has not been deprecated", () => {
      assertNoIssues(
        `<mvc:View xmlns:m="sap.m" xmlns:mvc="sap.ui.core.mvc" xmlns:charts="sap.ca.ui.charts">
          <mvc:content>
            <m:Bar>
              <!-- unlike sap.ca.ui.charts.BubbleChart.content, sap.ui.core.TooltipBase is not deprecated -->
              <m:tooltip></m:tooltip>
            </m:Bar>
          </mvc:content>
        </m:View>`
      );
    });
  });
});
