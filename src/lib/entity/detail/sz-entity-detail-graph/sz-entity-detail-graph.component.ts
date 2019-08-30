import { ChangeDetectionStrategy, Component, HostBinding, Input, ViewChild, Output, OnInit, OnDestroy, EventEmitter, ElementRef } from '@angular/core';
import { SzPrefsService } from '../../../services/sz-prefs.service';
import { takeUntil, debounceTime, filter } from 'rxjs/operators';
import { Subject } from 'rxjs';

import {
  SzEntityData,
  SzRelatedEntity,
  SzResolvedEntity,
  SzEntityRecord,
  SzRelationshipType
} from '@senzing/rest-api-client-ng';
import { SzEntityDetailGraphControlComponent } from './sz-entity-detail-graph-control.component';
import { SzRelationshipNetworkComponent } from '@senzing/sdk-graph-components';

/**
 * @internal
 * @export
 */
@Component({
  selector: 'sz-entity-detail-graph',
  templateUrl: './sz-entity-detail-graph.component.html',
  styleUrls: ['./sz-entity-detail-graph.component.scss']
})
export class SzEntityDetailGraphComponent implements OnInit, OnDestroy {
  /** subscription to notify subscribers to unbind */
  public unsubscribe$ = new Subject<void>();
  public isOpen: boolean = true;

  /**
   * @internal
   */
  @ViewChild(SzRelationshipNetworkComponent) graphNetworkComponent: SzRelationshipNetworkComponent;

  @Input() public title: string = "Relationships at a Glance";
  @Input() public data: {
    resolvedEntity: SzResolvedEntity,
    relatedEntities: SzRelatedEntity[]
  }
  public _showMatchKeys = false;
  /** sets the visibility of edge labels on the node links */
  @Input() public set showMatchKeys(value: boolean) {
    this._showMatchKeys = value;
    //console.log('@senzing/sdk-components-ng:sz-entity-detail-graph.showMatchKeys: ', value);
  };
  private _openInNewTab: boolean = false;
  /** whether or not to open entity clicks in new tab */
  @Input() public set openInNewTab(value: boolean) {
    this._openInNewTab = value;
    //console.log('@senzing/sdk-components-ng:sz-entity-detail-graph.openInNewTab: ', value);
  };
  public _openInSidePanel = false;
  /** whether or not to open entity clicks in side drawer */
  @Input() public set openInSidePanel(value: boolean) {
    this._openInSidePanel = value;
    //console.log('@senzing/sdk-components-ng:sz-entity-detail-graph.openInSidePanel: ', value);
  };
  @Input() sectionIcon: string;
  @Input() maxDegrees: number = 1;
  @Input() maxEntities: number = 20;
  @Input()
  set expanded(value) {
    this.isOpen = value;
  }
  get expanded(): boolean {
    return this.isOpen;
  }

  @HostBinding('class.open') get cssClssOpen() { return this.expanded; };
  @HostBinding('class.closed') get cssClssClosed() { return !this.expanded; };
  @ViewChild('graphContainer') graphContainerEle: ElementRef;
  @ViewChild(SzEntityDetailGraphControlComponent) graphControlComponent: SzEntityDetailGraphControlComponent;

  /**
   * emitted when the player right clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() contextMenuClick: EventEmitter<any> = new EventEmitter<any>();

  /**
   * emitted when the player clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() entityClick: EventEmitter<any> = new EventEmitter<any>();
  /**
   * emitted when the player clicks a entity node.
   * @returns object with various entity and ui properties.
   */
  @Output() entityDblClick: EventEmitter<any> = new EventEmitter<any>();

  public get graphIds(): number[] {
    let _ret = [];
    if(this.data && this.data.resolvedEntity) {
      _ret.push(this.data.resolvedEntity.entityId);
    }
    return _ret;
  }

  /** toggle collapsed/expanded state of graph */
  toggleExpanded(evt: Event) {
    this.expanded = !this.expanded;
  }
  /**
   * on entity node click in the graph.
   * proxies to synthetic "entityClick" event.
   */
  public onEntityClick(event: any) {
    this.entityClick.emit(event);
  }
  /**
   * on entity node click in the graph.
   * proxies to synthetic "entityClick" event.
   */
  public onEntityDblClick(event: any) {
    this.entityDblClick.emit(event);
  }
  /**
   * on entity node right click in the graph.
   * proxies to synthetic "contextMenuClick" event.
   * automatically adds the container ele page x/y to relative svg x/y for total x/y offset
   */
  public onRightClick(event: any) {
    if(this.graphContainerEle && this.graphContainerEle.nativeElement) {
      interface evtModel {
        address?: string
        entityId?: number
        iconType?: string
        index?: number
        isCoreNode?: false
        isQueriedNode?: false
        name?: string
        orgName?: string
        phone?: string
        x?: number
        y?: number
      }

      const pos: {x, y} = this.graphContainerEle.nativeElement.getBoundingClientRect();
      const evtSynth: evtModel = Object.assign({}, event);
      // change x/y to include element relative offset
      evtSynth.x = (Math.floor(pos.x) + Math.floor(event.x));
      evtSynth.y = (Math.floor(pos.y) + Math.floor(event.y));
      //console.warn('onRightClick: ', pos, event);
      this.contextMenuClick.emit( evtSynth );
    }
  }

  public onOptionChange(event: {name: string, value: any}) {
    switch(event.name) {
      case 'showLinkLabels':
        this.showMatchKeys = event.value;
        break;
    }
  }

  constructor(
    public prefs: SzPrefsService
  ) {}

  /**
   * unsubscribe when component is destroyed
   */
  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngOnInit() {
    // graph prefs
    this.prefs.graph.prefsChanged.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(1250)
    ).subscribe( this.onPrefsChange.bind(this) );
    // entity prefs
    this.prefs.entityDetail.prefsChanged.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe( (prefs: any) => {
      if(prefs.hideGraphWhenZeroRelations && this.data.relatedEntities.length == 0){
        this.isOpen = false;
      } else if(this.data.relatedEntities.length == 0 && this.isOpen == false) {
        this.isOpen = true;
      }
    })

  }
  /**
   * when the graph component returns no results on its data response
   * this handler is invoked.
   * @param data
   */
  public onNoResults(data: any) {
    // when set to autocollapse on no results
    // collapse tray
    if(this.prefs.entityDetail.hideGraphWhenZeroRelations){
      this.isOpen = false;
    }
  }

  /** proxy handler for when prefs have changed externally */
  private onPrefsChange(prefs: any) {
    //console.warn('@senzing/sdk-components-ng/sz-entity-detail-graph.onPrefsChange(): ', prefs);
    this._showMatchKeys = prefs.showMatchKeys;
    this.maxDegrees = prefs.maxDegreesOfSeparation;
    this.maxEntities = prefs.maxEntities;

    if(this.graphNetworkComponent) {
      // update graph with new properties
      this.graphNetworkComponent.maxDegrees = this.maxDegrees.toString();
      this.graphNetworkComponent.maxEntities = this.maxEntities.toString();
      this.reload();
    }
  }

  private reload() {
    console.log('@senzing/sdk-components-ng/sz-entity-detail-graph.reload: ', this.graphNetworkComponent);
    this.graphNetworkComponent.reload();
  }

}
