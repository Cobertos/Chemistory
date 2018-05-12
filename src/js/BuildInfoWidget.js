import $ from "jquery";
import moment from "moment";
import buildInfo from "./buildInfo.json";

export class BuildInfoWidget {
  constructor() {
    let $html = $($.parseHTML(`
    <button class="buildInfoButton open">X</button>
    <section class="buildInfo open">
      <h2>
        Welcome to Chemistory Dev! (${buildInfo.branch} - ${buildInfo.commit})<br>
        Built ${moment(buildInfo.time).fromNow()}
      </h2>
      <pre>${buildInfo.description}</pre>
      <h4>New in this version:</h4>
      <pre>${buildInfo.changelog}</pre>
    </section>`));

    let buildInfoEl = $html
          .find(".buildInfo")
          .addBack(".buildInfo");
    let buildInfoBtn = $html
          .find(".buildInfoButton")
          .addBack(".buildInfoButton");

    buildInfoBtn.on("click", ()=>{
        let newOpen = !buildInfoEl.is(".open");
        buildInfoEl.toggleClass("open", newOpen);
        buildInfoBtn.toggleClass("open", newOpen)
          .text(newOpen ? "X" : "?");
      });
    this._$ = $html;
  }

  $() {
    return this._$;
  }

  $body() {
    return this._$.find(".buildInfo").addBack(".buildInfo").first();
  }
}