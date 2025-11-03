<script lang="ts">
    import BuildSpecUI from "./BuildSpecUI.svelte";

</script>



<div class="sheer SequenceUI">
    <div class="sheer topLeft"></div>
    <div class="sheer topRight"></div>
    <div class="sheer bottomLeft buildSpecs">
        <BuildSpecUI/>
        <BuildSpecUI/>
    </div>
    <div class="sheer bottomRight"></div>
</div>



<style>
    .SequenceUI {
        display: grid;

        gap: 10px;
        
        grid-template-columns: max-content 1fr;
        grid-auto-rows: max-content 1fr;

        > .sheer {
            min-width: 20px;
            min-height: 20px;
        }
    }

    .buildSpecs {
        display: grid;
        
        gap: 10px;

        grid-template-columns: max-content;
        align-content: start;
    }
</style>