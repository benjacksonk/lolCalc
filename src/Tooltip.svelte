<script lang="ts">
    let {
        edgeAlignment,
        children,
    } : {
        edgeAlignment?: "left"|"right",
        children: any,
    } = $props();
</script>



<div class="Tooltip onHover"
class:alignLeftEdge={edgeAlignment == "left"}
class:alignRightEdge={edgeAlignment == "right"}
>
    {@render children?.()}
</div>



<style>
    .Tooltip {
    }
</style>