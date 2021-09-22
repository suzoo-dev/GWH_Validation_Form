/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;

import { VisualSettings } from "./settings";

import * as React from "react";
import * as ReactDOM from "react-dom";

import axios from 'axios';

import Main from "./main";

import "./../style/visual.less";
import azureEndpointConfig from "./config/azureEndpoints.js";

// const endpoints = azureEndpointConfig['prod'];
const endpoints = azureEndpointConfig['dev']; //uncomment to point custom visual at development database and logic apps

export class Visual implements IVisual {
    private settings: VisualSettings;

    private target: HTMLElement;
    private reactRoot: React.ComponentElement<any, any>;

    constructor(options: VisualConstructorOptions) {
        options.element.style.overflow = 'auto';
        this.reactRoot = React.createElement(Main, {});
        this.target = options.element;

        ReactDOM.render(this.reactRoot, this.target)
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView) as VisualSettings;
    }

    public update(options: VisualUpdateOptions) {
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0] );

        if(options.dataViews && options.dataViews[0]){
            const dataView: DataView = options.dataViews[0];
            const pathwayKeys = dataView.table.rows.map(row => row[0]).toString()

            const outcomes = axios.post(endpoints.outcomes,{
                "pathwayKeys": pathwayKeys
            })

            const outcomeTypes = axios.post(endpoints.outcomeTypes,{
                "Useage": this.settings.outcomeType.useage
            })

            const nextActionTypes = axios.get(endpoints.nextActionTypes)

            axios.all([outcomes, outcomeTypes, nextActionTypes])
                .then(axios.spread((...responses) => {
                    Main.update({
                        rows: dataView.table.rows,
                        columns: dataView.table.columns.map(col => {
                            return {
                                displayName: col.displayName,
                                type: col.type
                            }
                        }),
                        columnHeaders: this.settings.columnHeaders,
                        validations: responses[0].data["Table1"] || [],
                        outcomeTypes: responses[1].data,
                        nextActionTypes: responses[2].data["Table1"],
                        fieldNames: this.settings.fieldNames,
                        endpoints: endpoints
                    });
                })).catch(error => {
                    console.log(error)
                })
        } 
        // else {
        //     this.clear();
        // }
    }

    // private clear() {
    //     Main.update(initialState);
    // }
    
}